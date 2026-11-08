/**
 * Ilha do bloco `curriculo` (com `showDownload`): o botão de baixar em PDF. O gerador
 * (`curriculo-pdf`) só é baixado no clique; a ilha em si pesa quase nada.
 */
import { useState } from "react";
import type { ResumeItem } from "../render/collections";
import { makeT } from "./kit";

interface CurriculoProps {
  locale: string;
  items: ResumeItem[];
  texts: Record<string, string>;
  site: { name: string; person?: { name: string; jobTitle?: string; email?: string } | null; organization?: { email?: string; phone?: string } | null; social: { network: string; url: string }[] };
}

export default function Curriculo({ locale, items, texts, site }: CurriculoProps) {
  const t = makeT(texts);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function download() {
    // A aba nasce no clique (senão o navegador bloqueia o pop-up); o gerador chega depois.
    const target = window.open("", "_blank");
    if (!target) {
      setFailed(true);
      return;
    }
    setBusy(true);
    setFailed(false);
    try {
      const { printResume } = await import("./curriculo-pdf");
      const email = site.person?.email ?? site.organization?.email;
      printResume(
        {
          name: site.person?.name ?? site.name,
          ...(site.person?.jobTitle ? { jobTitle: site.person.jobTitle } : {}),
          contact: [email, site.organization?.phone, ...site.social.map((s) => s.url.replace(/^https?:\/\/(www\.)?/, ""))].filter((v): v is string => !!v),
          locale,
          items,
          labels: {
            experience: t("resume.experience"),
            education: t("resume.education"),
            skill: t("resume.skill"),
            certification: t("resume.certification"),
            language: t("resume.language"),
            volunteer: t("resume.volunteer"),
            "soft-skill": t("resume.soft-skill"),
            present: t("resume.present"),
          },
        },
        target,
      );
    } catch {
      target.close();
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" className="rb-button rb-button--secondary" onClick={download} disabled={busy}>
        {t("resume.download")}
      </button>
      {failed && (
        <p className="rb-form__error" role="alert">
          {t("resume.downloadError")}
        </p>
      )}
    </div>
  );
}
