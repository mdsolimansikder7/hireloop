import { SkillChips } from "@/components/jobs/details/SkillChips";
import { BenefitsGrid } from "@/components/jobs/details/BenefitsGrid";
import type { Job } from "@/lib/api/jobs";

interface JobDescriptionProps {
  job: Job;
}

function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <ul className="space-y-3.5">
      {items.map((item, idx) => (
        <li
          key={idx}
          className="flex items-start gap-3 text-[13px] leading-[1.7] text-[#a1a1aa]"
        >
          <span
            className="mt-2 size-[5px] shrink-0 rounded-full bg-[#6b7280]"
            aria-hidden="true"
          />
          <span className="flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function JobDescription({ job }: JobDescriptionProps) {
  const hasDescription = Boolean(job.description?.trim());
  const hasResponsibilities = Boolean(
    job.responsibilities && job.responsibilities.length > 0,
  );
  const hasSkills = Boolean(job.skills && job.skills.length > 0);
  const hasRequirementsList = Boolean(
    job.requirements && job.requirements.length > 0,
  );
  const hasRequirementsSection = hasSkills || hasRequirementsList;
  const hasBenefits = Boolean(job.benefits && job.benefits.length > 0);

  const sections: React.ReactNode[] = [];

  // 1. Job Description
  if (hasDescription) {
    sections.push(
      <section key="description" aria-labelledby="heading-job-description">
        <h2
          id="heading-job-description"
          className="text-[17px] font-semibold tracking-tight text-white"
        >
          Job Description
        </h2>
        <p className="mt-3.5 text-[13px] leading-[1.7] text-[#a1a1aa] whitespace-pre-line">
          {job.description}
        </p>
      </section>,
    );
  }

  // 2. Responsibilities
  if (hasResponsibilities) {
    sections.push(
      <section key="responsibilities" aria-labelledby="heading-responsibilities">
        <h2
          id="heading-responsibilities"
          className="text-[17px] font-semibold tracking-tight text-white"
        >
          Responsibilities
        </h2>
        <div className="mt-3.5">
          <BulletList items={job.responsibilities!} />
        </div>
      </section>,
    );
  }

  // 3. Requirements
  if (hasRequirementsSection) {
    sections.push(
      <section key="requirements" aria-labelledby="heading-requirements">
        <h2
          id="heading-requirements"
          className="text-[17px] font-semibold tracking-tight text-white"
        >
          Requirements
        </h2>

        {hasSkills && (
          <div className="mt-4">
            <SkillChips skills={job.skills!} />
          </div>
        )}

        {hasRequirementsList && (
          <div className={hasSkills ? "mt-5" : "mt-3.5"}>
            <BulletList items={job.requirements!} />
          </div>
        )}
      </section>,
    );
  }

  // 4. Benefits
  if (hasBenefits) {
    sections.push(
      <section key="benefits" aria-labelledby="heading-benefits">
        <h2
          id="heading-benefits"
          className="text-[17px] font-semibold tracking-tight text-white"
        >
          Benefits
        </h2>
        <div className="mt-4">
          <BenefitsGrid benefits={job.benefits!} />
        </div>
      </section>,
    );
  }

  if (sections.length === 0) return null;

  return (
    <article className="rounded-[16px] border border-white/[0.08] bg-[#111111] p-5 shadow-sm sm:p-8">
      <div className="divide-y divide-white/[0.06]">
        {sections.map((sectionNode, idx) => (
          <div
            key={idx}
            className={idx === 0 ? "pb-7" : idx === sections.length - 1 ? "pt-7" : "py-7"}
          >
            {sectionNode}
          </div>
        ))}
      </div>
    </article>
  );
}
