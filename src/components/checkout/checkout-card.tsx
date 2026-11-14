"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bitcoin,
  CreditCard,
  HelpCircle,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import type {
  Stripe,
  StripeCardCvcElementOptions,
  StripeCardExpiryElementOptions,
  StripeCardNumberElementOptions,
} from "@stripe/stripe-js";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/toast-provider";
import {
  confirmCheckoutPayment,
  createPaymentIntent,
  fetchCheckoutConfig,
  type BillingPeriod,
  type CheckoutConfig,
  type CheckoutCurrency,
} from "@/lib/api/checkout";
import { cn } from "@/lib/utils";

const FALLBACK_USD_TO_BDT = 127.6665;

const currencies: {
  code: CheckoutCurrency;
  Flag: ({ className }: { className?: string }) => ReactNode;
}[] = [
  { code: "BDT", Flag: FlagBD },
  { code: "USD", Flag: FlagUS },
];

const countries = [
  { code: "BD", label: "Bangladesh", Flag: FlagBD },
  { code: "US", label: "United States", Flag: FlagUS },
  { code: "IN", label: "India", Flag: FlagIN },
  { code: "GB", label: "United Kingdom", Flag: FlagGB },
  { code: "CA", label: "Canada", Flag: FlagCA },
  { code: "AU", label: "Australia", Flag: FlagAU },
  { code: "DE", label: "Germany", Flag: FlagDE },
  { code: "SG", label: "Singapore", Flag: FlagSG },
];

const countryItems = countries.map(({ code, label }) => ({ value: code, label }));

type FormErrors = Partial<Record<"email" | "name", string>>;
type ElementErrors = Partial<Record<"number" | "expiry" | "cvc", string>>;

const fieldClass =
  "h-10 rounded-md border-white/[0.09] bg-[#1b1b1b] px-3 text-[13px] text-white shadow-none placeholder:text-[#6b6b76] focus-visible:border-white/25 focus-visible:ring-[3px] focus-visible:ring-white/10 dark:border-white/[0.09] dark:bg-[#1b1b1b]";

const errorFieldClass =
  "border-red-400/60 focus-visible:border-red-400 focus-visible:ring-red-400/20 dark:border-red-400/60";

const fieldLabelClass =
  "mb-1.5 text-[9px] font-medium tracking-[0.08em] text-[#8c8c96] uppercase";

const tabTriggerClass =
  "h-full flex-1 gap-1.5 rounded-[6px] border-0 bg-transparent text-[11px] font-semibold text-black/70 shadow-none transition-colors hover:text-black data-active:bg-[linear-gradient(180deg,#2bf593_0%,#00d967_100%)] data-active:text-black data-active:shadow-[0_1px_2px_rgba(0,0,0,0.35)] dark:bg-transparent dark:text-black/70 dark:data-active:bg-[linear-gradient(180deg,#2bf593_0%,#00d967_100%)] dark:data-active:text-black";

const stripeFontFamily =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const elementBaseStyle = {
  color: "#ffffff",
  fontSize: "13px",
  fontFamily: stripeFontFamily,
  fontSmoothing: "antialiased" as const,
  "::placeholder": { color: "#6b6b76" },
  iconColor: "#a1a1aa",
};

const cardNumberOptions: StripeCardNumberElementOptions = {
  showIcon: true,
  placeholder: "1234 1234 1234 1234",
  style: {
    base: elementBaseStyle,
    invalid: { color: "#f87171", iconColor: "#f87171" },
  },
};

const cardExpiryOptions: StripeCardExpiryElementOptions = {
  style: {
    base: elementBaseStyle,
    invalid: { color: "#f87171", iconColor: "#f87171" },
  },
};

const cardCvcOptions: StripeCardCvcElementOptions = {
  style: {
    base: elementBaseStyle,
    invalid: { color: "#f87171", iconColor: "#f87171" },
  },
};

let cachedStripe: { key: string; promise: Promise<Stripe | null> } | null = null;

function getStripePromise(key: string) {
  if (!cachedStripe || cachedStripe.key !== key) {
    cachedStripe = { key, promise: loadStripe(key) };
  }
  return cachedStripe.promise;
}

export function CheckoutCard({
  planId,
  billing,
}: {
  planId: string;
  billing: BillingPeriod;
}) {
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [currency, setCurrency] = useState<CheckoutCurrency>("BDT");

  useEffect(() => {
    const controller = new AbortController();

    fetchCheckoutConfig(planId, billing, controller.signal)
      .then((data) => {
        setConfig(data);
        setCurrency(data.defaultCurrency);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setConfigError(
          error instanceof Error ? error.message : "Could not load checkout.",
        );
      });

    return () => controller.abort();
  }, [reloadKey, planId, billing]);

  function retryConfig() {
    setConfig(null);
    setConfigError(null);
    setReloadKey((key) => key + 1);
  }

  const stripePromise =
    config?.stripeReady && config.publishableKey
      ? getStripePromise(config.publishableKey)
      : null;

  const activePrice =
    config?.currencies.find((item) => item.currency === currency) ??
    config?.currencies[0] ??
    null;
  const total = activePrice?.display ?? "";
  const planName = config?.plan.name ?? "";
  const planDescription = config?.plan.description ?? "";
  const billingLabel =
    config?.plan.billing === "yearly" ? "Billed yearly" : "Billed monthly";
  const usdToBdt = config?.usdToBdt ?? FALLBACK_USD_TO_BDT;

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white">
      <div className="mx-auto w-full max-w-[1120px] px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Back to billing"
              className="text-[#b9b9c2] hover:bg-white/[0.06] hover:text-white"
              nativeButton={false}
              render={<Link href="/billing" />}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <LockKeyhole className="size-3.5 text-[#77777f]" aria-hidden="true" />
          </div>

          <Badge
            variant="outline"
            className="h-6 rounded border-white/[0.14] bg-white/[0.03] px-2 text-[9px] font-semibold tracking-[0.14em] text-[#c9c9d2] uppercase"
          >
            Sandbox
          </Badge>
        </div>

        <div className="mt-9 grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-x-24">
          {/* Order summary */}
          <section aria-label="Order summary" className="min-w-0">
            <p className="text-[9px] font-semibold tracking-[0.12em] text-[#9a9aa3] uppercase">
              Choose a currency:
            </p>

            <div
              role="radiogroup"
              aria-label="Currency"
              className="mt-2 grid grid-cols-2 gap-2.5"
            >
              {currencies.map(({ code, Flag }) => {
                const active = currency === code;
                const price = config?.currencies.find(
                  (item) => item.currency === code,
                );
                return (
                  <button
                    key={code}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setCurrency(code)}
                    className={cn(
                      "flex h-[52px] items-center gap-2.5 rounded-lg border bg-[#131313] px-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-white/15",
                      active
                        ? "border-white/70 bg-[#1a1a1a]"
                        : "border-white/[0.09] hover:border-white/25",
                    )}
                  >
                    <Flag className="size-[18px] shrink-0" />
                    {price ? (
                      <span className="truncate text-[12px] font-semibold tracking-tight">
                        {price.display}
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="inline-block h-3 w-20 animate-pulse rounded bg-white/10"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <p className="mt-2 text-[9px] text-[#77777f]">
              1 USD = {usdToBdt} BDT
            </p>

            <Separator className="my-6 bg-white/[0.08]" />

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[13px] font-medium">
                  {planName || (
                    <span
                      aria-hidden="true"
                      className="inline-block h-3.5 w-32 animate-pulse rounded bg-white/10"
                    />
                  )}
                </p>
                <p className="mt-1 text-[10px] text-[#8c8c96]">
                  {planDescription}
                  {config ? ` · ${billingLabel}` : null}
                </p>
              </div>
              {config ? (
                <p className="shrink-0 text-[13px] font-semibold tabular-nums">
                  {total}
                </p>
              ) : (
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-block h-3.5 w-24 animate-pulse rounded bg-white/10"
                />
              )}
            </div>

            <div className="mt-10 flex items-center gap-1.5 text-[9px] text-[#6f6f79]">
              <LockKeyhole className="size-3" aria-hidden="true" />
              Payments are encrypted and secure.
            </div>
          </section>

          {/* Payment form */}
          <section aria-label="Payment details" className="min-w-0">
            <Tabs defaultValue="card" className="gap-0">
              <TabsList className="h-10 w-full rounded-lg bg-[#00e56f] p-1 text-black">
                <TabsTrigger value="card" className={tabTriggerClass}>
                  <CreditCard className="size-3.5" aria-hidden="true" />
                  Pay
                </TabsTrigger>
                <TabsTrigger value="bitcoin" className={tabTriggerClass}>
                  <Bitcoin className="size-3.5" aria-hidden="true" />
                  Bitcoin
                </TabsTrigger>
              </TabsList>

              <p className="my-4 text-center text-[10px] text-[#85858e]">or</p>

              <TabsContent value="card" className="mt-0">
                {configError ? (
                  <SetupError
                    message={configError}
                    onRetry={retryConfig}
                  />
                ) : !config || !stripePromise ? (
                  <CheckoutSkeleton />
                ) : (
                  <Elements stripe={stripePromise} options={{ locale: "auto" }}>
                    <CardPaymentForm
                      planId={planId}
                      billing={billing}
                      currency={activePrice?.currency ?? currency}
                      total={total}
                    />
                  </Elements>
                )}
              </TabsContent>

              <TabsContent value="bitcoin" className="mt-0">
                <div className="rounded-lg border border-white/[0.09] bg-[#101010] p-6 text-center">
                  <span className="mx-auto grid size-10 place-items-center rounded-full bg-[#f7931a]/10 text-[#f7931a]">
                    <Bitcoin className="size-5" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-[13px] font-medium">
                    Bitcoin is unavailable
                  </p>
                  <p className="mx-auto mt-1.5 max-w-[280px] text-[10px] leading-relaxed text-[#85858e]">
                    Bitcoin payments are not enabled on this Stripe account.
                    Choose the Pay tab to continue with a card.
                  </p>
                  <Button
                    disabled
                    className="mt-4 h-10 w-full rounded-md bg-[#f7931a]/40 text-[12px] font-semibold text-black/60"
                  >
                    Not available
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </div>

        <footer className="mt-14 flex flex-col items-center gap-3 border-t border-white/[0.06] pt-5 text-[10px] text-[#77777f]">
          <span className="inline-flex items-center gap-1.5">
            <LockKeyhole className="size-3" aria-hidden="true" />
            Powered by
            <span className="font-semibold text-[#b9b9c2]">Stripe</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/#terms" className="transition-colors hover:text-white">
              Terms
            </Link>
            <Link href="/#privacy" className="transition-colors hover:text-white">
              Privacy
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function CardPaymentForm({
  planId,
  billing,
  currency,
  total,
}: {
  planId: string;
  billing: BillingPeriod;
  currency: CheckoutCurrency;
  total: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("BD");
  const [saveInfo, setSaveInfo] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [elementErrors, setElementErrors] = useState<ElementErrors>({});
  const [processing, setProcessing] = useState(false);

  const selectedCountry =
    countries.find((item) => item.code === country) ?? countries[0];
  const CountryFlag = selectedCountry.Flag;

  function updateElementError(
    field: keyof ElementErrors,
    message: string | undefined,
  ) {
    setElementErrors((current) => {
      if (current[field] === message) return current;
      return { ...current, [field]: message };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements || processing) return;

    const cardNumber = elements.getElement(CardNumberElement);
    const cardExpiry = elements.getElement(CardExpiryElement);
    const cardCvc = elements.getElement(CardCvcElement);

    if (!cardNumber || !cardExpiry || !cardCvc) {
      showToast("Card form is still loading. Please try again.", "error");
      return;
    }

    const nextErrors: FormErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (name.trim().length < 2) {
      nextErrors.name = "Enter the name on your card.";
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showToast("Please check the highlighted details.", "error");
      return;
    }

    if (Object.values(elementErrors).some(Boolean)) {
      showToast("Please check your card details.", "error");
      return;
    }

    setProcessing(true);

    try {
      const intent = await createPaymentIntent({
        planId,
        billing,
        currency,
        email: email.trim(),
      });

      const result = await stripe.confirmCardPayment(intent.clientSecret, {
        receipt_email: email.trim(),
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: name.trim(),
            email: email.trim(),
            address: { country },
          },
        },
      });

      if (result.error) {
        showToast(
          result.error.message ?? "Your card could not be charged.",
          "error",
        );
        return;
      }

      const paymentIntent = result.paymentIntent;
      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        showToast(
          `Payment ${paymentIntent?.status ?? "incomplete"}. Please try again.`,
          "error",
        );
        return;
      }

      await confirmCheckoutPayment(paymentIntent.id);
      void fetch("/api/checkout/save-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: paymentIntent.id,
          paymentIntentId: paymentIntent.id,
          plan: planId,
          billing,
          amount: intent.amount,
          currency: intent.currency,
          status: "success",
          userEmail: email.trim(),
        }),
      }).catch(() => {});
      router.push(
        `/checkout/success?paymentIntentId=${encodeURIComponent(paymentIntent.id)}&plan=${encodeURIComponent(planId)}&billing=${billing}`,
      );

      showToast(`Payment successful — ${intent.display} charged.`, "success");
      cardNumber.clear();
      cardExpiry.clear();
      cardCvc.clear();
      setName("");
      setSaveInfo(false);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Checkout failed.",
        "error",
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <Label
          htmlFor="checkout-email"
          className="mb-2 text-[11px] font-medium text-[#e6e6ea]"
        >
          Contact Information
        </Label>
        <Input
          id="checkout-email"
          type="email"
          autoComplete="email"
          placeholder="email@example.com"
          value={email}
          aria-invalid={Boolean(errors.email)}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((current) => ({ ...current, email: undefined }));
          }}
          className={cn(fieldClass, errors.email && errorFieldClass)}
        />
        {errors.email ? <FieldError>{errors.email}</FieldError> : null}
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[11px] font-medium text-[#e6e6ea]">
          Payment method
        </p>

        <div className="overflow-hidden rounded-lg border border-white/[0.09] bg-[#101010]">
          <div className="flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-3">
            <CreditCard className="size-3.5 text-[#9a9aa3]" aria-hidden="true" />
            <span className="text-[12px] font-medium text-white">Card</span>
            <span
              className="ml-auto inline-flex items-center gap-1 rounded border border-white/[0.08] px-1.5 py-0.5 text-[7px] font-medium tracking-wide text-[#8c8c96] uppercase"
              title="Card data is handled by Stripe"
            >
              <LockKeyhole className="size-2" aria-hidden="true" />
              Secure
            </span>
          </div>

          <div className="p-3">
            <div>
              <span className={fieldLabelClass}>Card information</span>
              <div
                className={cn(
                  "flex h-10 items-center rounded-md border bg-[#1b1b1b] px-3 transition-colors focus-within:border-white/25",
                  elementErrors.number
                    ? "border-red-400/60"
                    : "border-white/[0.09]",
                )}
              >
                <CardNumberElement
                  className="w-full"
                  options={cardNumberOptions}
                  onChange={(event) =>
                    updateElementError("number", event.error?.message)
                  }
                />
              </div>
              {elementErrors.number ? (
                <FieldError>{elementErrors.number}</FieldError>
              ) : null}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <span className={fieldLabelClass}>Expiration date</span>
                <div
                  className={cn(
                    "relative flex h-10 items-center rounded-md border bg-[#1b1b1b] pr-9 pl-3 transition-colors focus-within:border-white/25",
                    elementErrors.expiry
                      ? "border-red-400/60"
                      : "border-white/[0.09]",
                  )}
                >
                  <CardExpiryElement
                    className="w-full"
                    options={cardExpiryOptions}
                    onChange={(event) =>
                      updateElementError("expiry", event.error?.message)
                    }
                  />
                  <CreditCard
                    className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-[#6f6f79]"
                    aria-hidden="true"
                  />
                </div>
                {elementErrors.expiry ? (
                  <FieldError>{elementErrors.expiry}</FieldError>
                ) : null}
              </div>

              <div>
                <span className={fieldLabelClass}>CVC</span>
                <div
                  className={cn(
                    "relative flex h-10 items-center rounded-md border bg-[#1b1b1b] pr-9 pl-3 transition-colors focus-within:border-white/25",
                    elementErrors.cvc
                      ? "border-red-400/60"
                      : "border-white/[0.09]",
                  )}
                >
                  <CardCvcElement
                    className="w-full"
                    options={cardCvcOptions}
                    onChange={(event) =>
                      updateElementError("cvc", event.error?.message)
                    }
                  />
                  <HelpCircle
                    className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-[#6f6f79]"
                    aria-hidden="true"
                  />
                </div>
                {elementErrors.cvc ? (
                  <FieldError>{elementErrors.cvc}</FieldError>
                ) : null}
              </div>
            </div>

            <div className="mt-3">
              <Label htmlFor="checkout-name" className={fieldLabelClass}>
                Cardholder name
              </Label>
              <Input
                id="checkout-name"
                autoComplete="cc-name"
                placeholder="Full name on card"
                value={name}
                aria-invalid={Boolean(errors.name)}
                onChange={(event) => {
                  setName(event.target.value);
                  setErrors((current) => ({ ...current, name: undefined }));
                }}
                className={cn(fieldClass, errors.name && errorFieldClass)}
              />
              {errors.name ? <FieldError>{errors.name}</FieldError> : null}
            </div>

            <div className="mt-3">
              <Label htmlFor="checkout-country" className={fieldLabelClass}>
                Country or region
              </Label>
              <Select
                items={countryItems}
                value={country}
                onValueChange={(value) => setCountry(String(value ?? "BD"))}
              >
                <SelectTrigger
                  id="checkout-country"
                  className="h-10 w-full rounded-md border-white/[0.09] bg-[#1b1b1b] px-3 text-[13px] text-white dark:border-white/[0.09] dark:bg-[#1b1b1b] dark:hover:bg-[#232323]"
                >
                  <span className="flex items-center gap-2">
                    <CountryFlag className="size-3.5" />
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-[#171717] text-white">
                  {countries.map(({ code, label, Flag }) => (
                    <SelectItem key={code} value={code}>
                      <Flag className="size-3.5" />
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2.5">
        <Checkbox
          id="checkout-save-info"
          checked={saveInfo}
          onCheckedChange={(checked) => setSaveInfo(Boolean(checked))}
          className="mt-0.5 size-3.5 rounded-[3px] border-white/25 data-checked:border-[#0a66ff] data-checked:bg-[#0a66ff] data-checked:text-white dark:data-checked:bg-[#0a66ff]"
        />
        <div className="space-y-1">
          <Label
            htmlFor="checkout-save-info"
            className="text-[10.5px] leading-tight font-medium text-[#d8d8df]"
          >
            Save my information for faster checkout
          </Label>
          <p className="text-[9.5px] leading-relaxed text-[#7b7b85]">
            By providing your card information, you allow Hireloop to charge your
            card for future payments in accordance with their terms.
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || processing}
        aria-label={`Pay ${total}`}
        className="mt-5 h-11 w-full rounded-md bg-[#0a66ff] text-[13px] font-semibold text-white shadow-none hover:bg-[#0b5ae0] disabled:opacity-70"
      >
        {processing ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Processing…
          </>
        ) : (
          "Pay"
        )}
      </Button>

      <p className="mt-2.5 text-center text-[9px] text-[#6f6f79]">
        Test mode — use card 4242 4242 4242 4242, any future expiry date and any
        CVC.
      </p>
    </form>
  );
}

function CheckoutSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Connecting to secure checkout…</span>

      <div className="h-[34px] w-32 animate-pulse rounded bg-white/[0.06]" />
      <div className="mt-2 h-10 animate-pulse rounded-md bg-white/[0.06]" />

      <div className="mt-5 h-[34px] w-28 animate-pulse rounded bg-white/[0.06]" />
      <div className="mt-2 animate-pulse rounded-lg border border-white/[0.09] bg-[#101010]">
        <div className="h-10 border-b border-white/[0.07]" />
        <div className="space-y-3 p-3">
          <div className="h-[30px] w-24 rounded bg-white/[0.06]" />
          <div className="h-10 rounded-md bg-white/[0.06]" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-10 rounded-md bg-white/[0.06]" />
            <div className="h-10 rounded-md bg-white/[0.06]" />
          </div>
          <div className="h-10 rounded-md bg-white/[0.06]" />
          <div className="h-10 rounded-md bg-white/[0.06]" />
        </div>
      </div>

      <div className="mt-5 h-11 animate-pulse rounded-md bg-[#0a66ff]/40" />
    </div>
  );
}

function SetupError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-400/25 bg-red-400/[0.06] p-5 text-center"
    >
      <span className="mx-auto grid size-9 place-items-center rounded-full bg-red-400/10 text-red-300">
        <AlertTriangle className="size-4" aria-hidden="true" />
      </span>
      <p className="mt-3 text-[12px] font-medium text-[#f3f3f6]">
        Checkout is unavailable
      </p>
      <p className="mx-auto mt-1.5 max-w-[320px] text-[10px] leading-relaxed text-[#9a9aa4]">
        {message}
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onRetry}
        className="mt-4 h-9 rounded-md border-white/15 bg-transparent px-3 text-[11px] text-white hover:bg-white/[0.06] hover:text-white"
      >
        <RefreshCw className="size-3.5" aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}

function FieldError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-1.5 text-[10px] text-red-400">
      {children}
    </p>
  );
}

function FlagShell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-block size-4 shrink-0 overflow-hidden rounded-full",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-full" aria-hidden="true">
        {children}
      </svg>
    </span>
  );
}

function FlagBD({ className }: { className?: string }) {
  return (
    <FlagShell className={className}>
      <rect width="24" height="24" fill="#006a4e" />
      <circle cx="10.6" cy="12" r="4.9" fill="#f42a41" />
    </FlagShell>
  );
}

function FlagUS({ className }: { className?: string }) {
  return (
    <FlagShell className={className}>
      <rect width="24" height="24" fill="#ffffff" />
      {[0, 2, 4, 6, 8, 10, 12].map((index) => (
        <rect
          key={index}
          x="0"
          y={(index * 24) / 13}
          width="24"
          height={24 / 13}
          fill="#b22234"
        />
      ))}
      <rect x="0" y="0" width="11" height={(24 / 13) * 7} fill="#3c3b6e" />
    </FlagShell>
  );
}

function FlagIN({ className }: { className?: string }) {
  return (
    <FlagShell className={className}>
      <rect width="24" height="24" fill="#ffffff" />
      <rect width="24" height="8" fill="#ff9933" />
      <rect y="16" width="24" height="8" fill="#138808" />
      <circle
        cx="12"
        cy="12"
        r="2.3"
        fill="none"
        stroke="#1a3f8f"
        strokeWidth="0.8"
      />
    </FlagShell>
  );
}

function FlagGB({ className }: { className?: string }) {
  return (
    <FlagShell className={className}>
      <rect width="24" height="24" fill="#012169" />
      <path d="M0 0l24 24M24 0L0 24" stroke="#ffffff" strokeWidth="4.5" />
      <path d="M0 0l24 24M24 0L0 24" stroke="#c8102e" strokeWidth="2" />
      <path d="M12 0v24M0 12h24" stroke="#ffffff" strokeWidth="7" />
      <path d="M12 0v24M0 12h24" stroke="#c8102e" strokeWidth="4" />
    </FlagShell>
  );
}

function FlagCA({ className }: { className?: string }) {
  return (
    <FlagShell className={className}>
      <rect width="24" height="24" fill="#ffffff" />
      <path d="M0 0h7v24H0zM17 0h7v24h-7z" fill="#d80621" />
      <path
        d="M12 6.5l1.1 2.4 1.8-.8-.7 2.3 2.1.9-2.1 1.3.7 2.2-2.3-.5-.4 2.2h-.4l-.4-2.2-2.3.5.7-2.2L8 11.3l2.1-.9-.7-2.3 1.8.8z"
        fill="#d80621"
      />
    </FlagShell>
  );
}

function FlagAU({ className }: { className?: string }) {
  return (
    <FlagShell className={className}>
      <rect width="24" height="24" fill="#00008b" />
      <path d="M0 0l12 12M12 0L0 12" stroke="#ffffff" strokeWidth="2.6" />
      <path d="M6 0v12M0 6h12" stroke="#ffffff" strokeWidth="4" />
      <path d="M6 0v12M0 6h12" stroke="#c8102e" strokeWidth="2.2" />
      <circle cx="18" cy="7" r="1.2" fill="#ffffff" />
      <circle cx="16" cy="13" r="1" fill="#ffffff" />
      <circle cx="20" cy="14" r="1" fill="#ffffff" />
      <circle cx="18" cy="18" r="1" fill="#ffffff" />
    </FlagShell>
  );
}

function FlagDE({ className }: { className?: string }) {
  return (
    <FlagShell className={className}>
      <rect width="24" height="24" fill="#000000" />
      <rect y="8" width="24" height="8" fill="#dd0000" />
      <rect y="16" width="24" height="8" fill="#ffce00" />
    </FlagShell>
  );
}

function FlagSG({ className }: { className?: string }) {
  return (
    <FlagShell className={className}>
      <rect width="24" height="24" fill="#ffffff" />
      <rect width="24" height="12" fill="#ed2939" />
      <circle cx="9" cy="6" r="3.2" fill="#ffffff" />
      <circle cx="10.4" cy="6" r="2.9" fill="#ed2939" />
      <circle cx="12.6" cy="4.4" r="0.7" fill="#ffffff" />
      <circle cx="14.4" cy="6" r="0.7" fill="#ffffff" />
      <circle cx="13.6" cy="8" r="0.7" fill="#ffffff" />
    </FlagShell>
  );
}
