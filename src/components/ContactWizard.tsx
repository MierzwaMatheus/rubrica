import { useReducer, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { FlowType } from "@/contexts/ContactWizardContext";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// ── Types ─────────────────────────────────────────────────────────────────────

type ContactInfo = {
  name: string;
  email: string;
  phone?: string;
  linkedin?: string;
  company?: string;
};

type WizardState = {
  currentStep: number;
  flow: FlowType | null;
  answers: Record<string, string>;
  contactInfo: ContactInfo;
  isSubmitting: boolean;
  isSuccess: boolean;
  direction: number;
};

type Action =
  | { type: "SET_FLOW"; flow: FlowType }
  | { type: "SET_ANSWER"; key: string; value: string }
  | { type: "SET_CONTACT"; field: keyof ContactInfo; value: string }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR" };

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case "SET_FLOW":
      return { ...state, flow: action.flow, currentStep: 1, direction: 1 };
    case "SET_ANSWER":
      return { ...state, answers: { ...state.answers, [action.key]: action.value } };
    case "SET_CONTACT":
      return { ...state, contactInfo: { ...state.contactInfo, [action.field]: action.value } };
    case "NEXT":
      return { ...state, currentStep: state.currentStep + 1, direction: 1 };
    case "PREV":
      return { ...state, currentStep: Math.max(0, state.currentStep - 1), direction: -1 };
    case "SUBMIT_START":
      return { ...state, isSubmitting: true };
    case "SUBMIT_SUCCESS":
      return { ...state, isSubmitting: false, isSuccess: true };
    case "SUBMIT_ERROR":
      return { ...state, isSubmitting: false };
    default:
      return state;
  }
}

const initialState: WizardState = {
  currentStep: 0,
  flow: null,
  answers: {},
  contactInfo: { name: "", email: "" },
  isSubmitting: false,
  isSuccess: false,
  direction: 1,
};

// ── Step totals per flow ──────────────────────────────────────────────────────
const FLOW_STEPS: Record<FlowType, number> = {
  project: 6, // 4 steps + contact + summary
  job: 6,
  networking: 4,
  feedback: 4,
};

// ── Card option component ─────────────────────────────────────────────────────
function OptionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 rounded-md border font-mono text-sm transition-all duration-200",
        selected
          ? "border-neon-purple bg-neon-purple/10 text-foreground-strong"
          : "border-foreground/10 bg-foreground/5 text-foreground/90 hover:border-foreground/30 hover:bg-foreground/10"
      )}
    >
      <span className={cn("mr-2", selected ? "text-neon-purple" : "text-foreground/42")}>{">"}</span>
      {label}
    </button>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const { t } = useTranslation();
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-mono text-foreground/42">
        <span>{t("contactWizard.step")} {current} {t("contactWizard.of")} {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 w-full bg-foreground/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-neon-purple rounded-full"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

// ── Step: Flow selector ───────────────────────────────────────────────────────
function FlowSelector({ flow, dispatch }: { flow: FlowType | null; dispatch: React.Dispatch<Action> }) {
  const { t } = useTranslation();
  const flows: { key: FlowType; emoji: string }[] = [
    { key: "project", emoji: "💼" },
    { key: "job", emoji: "🧑‍💼" },
    { key: "networking", emoji: "🤝" },
    { key: "feedback", emoji: "💬" },
  ];
  return (
    <div className="space-y-3">
      {flows.map(({ key, emoji }) => (
        <OptionCard
          key={key}
          label={`${emoji}  ${t(`contactWizard.flows.${key}.label`)}`}
          selected={flow === key}
          onClick={() => dispatch({ type: "SET_FLOW", flow: key })}
        />
      ))}
    </div>
  );
}

// ── Step: Single-choice ───────────────────────────────────────────────────────
function ChoiceStep({
  title,
  answerKey,
  options,
  current,
  dispatch,
}: {
  title: string;
  answerKey: string;
  options: { value: string; label: string }[];
  current?: string;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-mono text-sm text-neon-lime">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={current === opt.value}
            onClick={() => dispatch({ type: "SET_ANSWER", key: answerKey, value: opt.value })}
          />
        ))}
      </div>
    </div>
  );
}

// ── Step: Text input ──────────────────────────────────────────────────────────
function TextStep({
  title,
  answerKey,
  placeholder,
  current,
  multiline,
  dispatch,
}: {
  title: string;
  answerKey: string;
  placeholder?: string;
  current?: string;
  multiline?: boolean;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-mono text-sm text-neon-lime">{title}</h3>
      {multiline ? (
        <Textarea
          placeholder={placeholder}
          value={current ?? ""}
          onChange={(e) => dispatch({ type: "SET_ANSWER", key: answerKey, value: e.target.value })}
          rows={5}
          className="bg-foreground/5 border-foreground/10 text-foreground-strong placeholder:text-foreground/25 resize-none font-mono text-sm"
        />
      ) : (
        <Input
          placeholder={placeholder}
          value={current ?? ""}
          onChange={(e) => dispatch({ type: "SET_ANSWER", key: answerKey, value: e.target.value })}
          className="bg-foreground/5 border-foreground/10 text-foreground-strong placeholder:text-foreground/25 font-mono text-sm"
        />
      )}
    </div>
  );
}

// ── Step: Dual text (job step4) ───────────────────────────────────────────────
function DualTextStep({
  title,
  companyKey,
  roleKey,
  companyPlaceholder,
  rolePlaceholder,
  answers,
  dispatch,
}: {
  title: string;
  companyKey: string;
  roleKey: string;
  companyPlaceholder?: string;
  rolePlaceholder?: string;
  answers: Record<string, string>;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-mono text-sm text-neon-lime">{title}</h3>
      <div className="space-y-3">
        <Input
          placeholder={companyPlaceholder}
          value={answers[companyKey] ?? ""}
          onChange={(e) => dispatch({ type: "SET_ANSWER", key: companyKey, value: e.target.value })}
          className="bg-foreground/5 border-foreground/10 text-foreground-strong placeholder:text-foreground/25 font-mono text-sm"
        />
        <Input
          placeholder={rolePlaceholder}
          value={answers[roleKey] ?? ""}
          onChange={(e) => dispatch({ type: "SET_ANSWER", key: roleKey, value: e.target.value })}
          className="bg-foreground/5 border-foreground/10 text-foreground-strong placeholder:text-foreground/25 font-mono text-sm"
        />
      </div>
    </div>
  );
}

// ── Step: Contact info ────────────────────────────────────────────────────────
function ContactStep({
  contactInfo,
  requirePhone,
  requireLinkedin,
  requireCompany,
  dispatch,
}: {
  contactInfo: ContactInfo;
  requirePhone?: boolean;
  requireLinkedin?: boolean;
  requireCompany?: boolean;
  dispatch: React.Dispatch<Action>;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <h3 className="font-mono text-sm text-neon-lime">{t("contactWizard.contact.title")}</h3>
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-foreground/65 font-mono mb-1 block">{t("contactWizard.contact.name")}</Label>
          <Input
            placeholder={t("contactWizard.contact.namePlaceholder")}
            value={contactInfo.name}
            onChange={(e) => dispatch({ type: "SET_CONTACT", field: "name", value: e.target.value })}
            className="bg-foreground/5 border-foreground/10 text-foreground-strong placeholder:text-foreground/25 font-mono text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-foreground/65 font-mono mb-1 block">{t("contactWizard.contact.email")}</Label>
          <Input
            type="email"
            placeholder={t("contactWizard.contact.emailPlaceholder")}
            value={contactInfo.email}
            onChange={(e) => dispatch({ type: "SET_CONTACT", field: "email", value: e.target.value })}
            className="bg-foreground/5 border-foreground/10 text-foreground-strong placeholder:text-foreground/25 font-mono text-sm"
          />
        </div>
        {requirePhone && (
          <div>
            <Label className="text-xs text-foreground/65 font-mono mb-1 block">{t("contactWizard.contact.phone")}</Label>
            <Input
              placeholder={t("contactWizard.contact.phonePlaceholder")}
              value={contactInfo.phone ?? ""}
              onChange={(e) => dispatch({ type: "SET_CONTACT", field: "phone", value: e.target.value })}
              className="bg-foreground/5 border-foreground/10 text-foreground-strong placeholder:text-foreground/25 font-mono text-sm"
            />
          </div>
        )}
        {requireLinkedin && (
          <div>
            <Label className="text-xs text-foreground/65 font-mono mb-1 block">{t("contactWizard.contact.linkedin")}</Label>
            <Input
              placeholder={t("contactWizard.contact.linkedinPlaceholder")}
              value={contactInfo.linkedin ?? ""}
              onChange={(e) => dispatch({ type: "SET_CONTACT", field: "linkedin", value: e.target.value })}
              className="bg-foreground/5 border-foreground/10 text-foreground-strong placeholder:text-foreground/25 font-mono text-sm"
            />
          </div>
        )}
        {requireCompany && (
          <div>
            <Label className="text-xs text-foreground/65 font-mono mb-1 block">{t("contactWizard.contact.company")}</Label>
            <Input
              placeholder={t("contactWizard.contact.companyPlaceholder")}
              value={contactInfo.company ?? ""}
              onChange={(e) => dispatch({ type: "SET_CONTACT", field: "company", value: e.target.value })}
              className="bg-foreground/5 border-foreground/10 text-foreground-strong placeholder:text-foreground/25 font-mono text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step: Summary ─────────────────────────────────────────────────────────────
function SummaryStep({
  state,
  sourceContext,
}: {
  state: WizardState;
  sourceContext?: string;
}) {
  const { t } = useTranslation();
  const flowLabel = state.flow ? t(`contactWizard.flows.${state.flow}.label`) : "";
  const answerEntries = Object.entries(state.answers).filter(([, v]) => v);
  return (
    <div className="space-y-4">
      <h3 className="font-mono text-sm text-neon-lime">{t("contactWizard.summary.title")}</h3>
      <div className="rounded-md border border-foreground/10 bg-foreground/5 p-4 space-y-3 font-mono text-xs text-foreground/90">
        <div>
          <span className="text-foreground/42">{t("contactWizard.summary.type")}: </span>
          <span className="text-neon-lime">{flowLabel}</span>
        </div>
        {sourceContext && (
          <div>
            <span className="text-foreground/42">{t("contactWizard.summary.origin")}: </span>
            <span>{sourceContext}</span>
          </div>
        )}
        {answerEntries.map(([k, v]) => (
          <div key={k}>
            <span className="text-foreground/42">{k}: </span>
            <span>{v}</span>
          </div>
        ))}
        <div className="pt-2 border-t border-foreground/10">
          <div className="text-foreground/42 mb-1">{t("contactWizard.summary.contact")}:</div>
          <div>{state.contactInfo.name}</div>
          <div>{state.contactInfo.email}</div>
          {state.contactInfo.phone && <div>{state.contactInfo.phone}</div>}
          {state.contactInfo.linkedin && <div>{state.contactInfo.linkedin}</div>}
          {state.contactInfo.company && <div>{state.contactInfo.company}</div>}
        </div>
      </div>
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
      <div className="h-16 w-16 rounded-full bg-neon-purple/20 border border-neon-purple flex items-center justify-center">
        <Check className="h-8 w-8 text-neon-purple" />
      </div>
      <h3 className="font-mono text-lg text-foreground-strong">{t("contactWizard.successTitle")}</h3>
      <p className="text-foreground/65 text-sm max-w-xs">{t("contactWizard.successBody")}</p>
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export function ContactWizard({
  initialFlow,
  sourceContext,
  onClose,
  onSubmitOverride,
}: {
  initialFlow?: FlowType;
  sourceContext?: string;
  onClose: () => void;
  onSubmitOverride?: (data: { type: FlowType; answers: Record<string, string>; contactInfo: ContactInfo }) => Promise<void>;
}) {
  const { t, tValue } = useTranslation();
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    flow: initialFlow ?? null,
    currentStep: initialFlow ? 1 : 0,
  });

  const prevDirection = useRef(state.direction);
  prevDirection.current = state.direction;

  const totalSteps = state.flow ? FLOW_STEPS[state.flow] : 1;

  const canNext = (): boolean => {
    if (state.currentStep === 0) return state.flow !== null;
    if (!state.flow) return false;

    const { answers, contactInfo } = state;

    if (state.flow === "project") {
      if (state.currentStep === 1) return !!answers.projectType;
      if (state.currentStep === 2) return !!answers.timeline;
      if (state.currentStep === 3) return !!answers.budget;
      if (state.currentStep === 4) return !!answers.description;
      if (state.currentStep === 5) return !!(contactInfo.name && contactInfo.email);
    }
    if (state.flow === "job") {
      if (state.currentStep === 1) return !!answers.contractType;
      if (state.currentStep === 2) return !!answers.modality;
      if (state.currentStep === 3) return !!answers.area;
      if (state.currentStep === 4) return !!(answers.jobCompany && answers.jobRole);
      if (state.currentStep === 5) return !!(contactInfo.name && contactInfo.email);
    }
    if (state.flow === "networking") {
      if (state.currentStep === 1) return !!answers.howFound;
      if (state.currentStep === 2) return !!answers.topic;
      if (state.currentStep === 3) return !!(contactInfo.name && contactInfo.email);
    }
    if (state.flow === "feedback") {
      if (state.currentStep === 1) return !!answers.about;
      if (state.currentStep === 2) return !!answers.message;
      if (state.currentStep === 3) return !!(contactInfo.name && contactInfo.email);
    }
    return true;
  };

  const isLastStep = state.currentStep === totalSteps;
  const isContactStep = !isLastStep && (
    (state.flow === "project" && state.currentStep === 5) ||
    (state.flow === "job" && state.currentStep === 5) ||
    (state.flow === "networking" && state.currentStep === 3) ||
    (state.flow === "feedback" && state.currentStep === 3)
  );
  const isSummaryStep = state.currentStep === totalSteps;

  const handleSubmit = async () => {
    if (!state.flow || !state.contactInfo.name || !state.contactInfo.email) return;
    dispatch({ type: "SUBMIT_START" });
    try {
      if (onSubmitOverride) {
        await onSubmitOverride({ type: state.flow, answers: state.answers, contactInfo: state.contactInfo });
      } else {
        const siteUrl = (import.meta.env.VITE_CONVEX_URL as string)?.replace('.convex.cloud', '.convex.site');
        const res = await fetch(`${siteUrl}/api/contact/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: state.flow,
            sourceContext,
            answers: state.answers,
            contactInfo: state.contactInfo,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? 'ERROR');
        }
        // conversão: o formulário chegou ao servidor
        trackEvent("contato-enviado", { flow: state.flow, origem: sourceContext ?? "desconhecida" });
      }
      dispatch({ type: "SUBMIT_SUCCESS" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("RATE_LIMITED")) {
        toast.error(t("contactWizard.rateLimited"));
      } else if (msg.includes("CONTACT_DISABLED")) {
        toast.error("O formulário de contato está temporariamente desativado.");
      } else {
        toast.error(t("contactWizard.errorMessage"));
      }
      dispatch({ type: "SUBMIT_ERROR" });
    }
  };

  const renderStep = () => {
    if (state.isSuccess) return <SuccessScreen />;
    if (state.currentStep === 0) {
      return (
        <div className="space-y-4">
          <h3 className="font-mono text-sm text-neon-lime">{t("contactWizard.subtitle")}</h3>
          <FlowSelector flow={state.flow} dispatch={dispatch} />
        </div>
      );
    }
    if (!state.flow) return null;

    const opts = (key: string) =>
      Object.entries(tValue(key) as Record<string, string>).map(([k, v]) => ({ value: k, label: v }));

    if (state.flow === "project") {
      if (state.currentStep === 1)
        return <ChoiceStep title={t("contactWizard.project.step1.title")} answerKey="projectType" current={state.answers.projectType} dispatch={dispatch} options={opts("contactWizard.project.step1.options")} />;
      if (state.currentStep === 2)
        return <ChoiceStep title={t("contactWizard.project.step2.title")} answerKey="timeline" current={state.answers.timeline} dispatch={dispatch} options={opts("contactWizard.project.step2.options")} />;
      if (state.currentStep === 3)
        return <ChoiceStep title={t("contactWizard.project.step3.title")} answerKey="budget" current={state.answers.budget} dispatch={dispatch} options={opts("contactWizard.project.step3.options")} />;
      if (state.currentStep === 4)
        return <TextStep title={t("contactWizard.project.step4.title")} answerKey="description" placeholder={t("contactWizard.project.step4.placeholder")} current={state.answers.description} multiline dispatch={dispatch} />;
      if (state.currentStep === 5)
        return <ContactStep contactInfo={state.contactInfo} requirePhone requireLinkedin dispatch={dispatch} />;
      if (state.currentStep === 6)
        return <SummaryStep state={state} sourceContext={sourceContext} />;
    }

    if (state.flow === "job") {
      if (state.currentStep === 1)
        return <ChoiceStep title={t("contactWizard.job.step1.title")} answerKey="contractType" current={state.answers.contractType} dispatch={dispatch} options={opts("contactWizard.job.step1.options")} />;
      if (state.currentStep === 2)
        return <ChoiceStep title={t("contactWizard.job.step2.title")} answerKey="modality" current={state.answers.modality} dispatch={dispatch} options={opts("contactWizard.job.step2.options")} />;
      if (state.currentStep === 3)
        return <ChoiceStep title={t("contactWizard.job.step3.title")} answerKey="area" current={state.answers.area} dispatch={dispatch} options={opts("contactWizard.job.step3.options")} />;
      if (state.currentStep === 4)
        return <DualTextStep title={t("contactWizard.job.step4.title")} companyKey="jobCompany" roleKey="jobRole" companyPlaceholder={t("contactWizard.job.step4.companyPlaceholder")} rolePlaceholder={t("contactWizard.job.step4.rolePlaceholder")} answers={state.answers} dispatch={dispatch} />;
      if (state.currentStep === 5)
        return <ContactStep contactInfo={state.contactInfo} requireLinkedin dispatch={dispatch} />;
      if (state.currentStep === 6)
        return <SummaryStep state={state} sourceContext={sourceContext} />;
    }

    if (state.flow === "networking") {
      if (state.currentStep === 1)
        return <ChoiceStep title={t("contactWizard.networking.step1.title")} answerKey="howFound" current={state.answers.howFound} dispatch={dispatch} options={opts("contactWizard.networking.step1.options")} />;
      if (state.currentStep === 2)
        return <TextStep title={t("contactWizard.networking.step2.title")} answerKey="topic" placeholder={t("contactWizard.networking.step2.placeholder")} current={state.answers.topic} multiline dispatch={dispatch} />;
      if (state.currentStep === 3)
        return <ContactStep contactInfo={state.contactInfo} requireLinkedin dispatch={dispatch} />;
      if (state.currentStep === 4)
        return <SummaryStep state={state} sourceContext={sourceContext} />;
    }

    if (state.flow === "feedback") {
      if (state.currentStep === 1)
        return <ChoiceStep title={t("contactWizard.feedback.step1.title")} answerKey="about" current={state.answers.about} dispatch={dispatch} options={opts("contactWizard.feedback.step1.options")} />;
      if (state.currentStep === 2)
        return <TextStep title={t("contactWizard.feedback.step2.title")} answerKey="message" placeholder={t("contactWizard.feedback.step2.placeholder")} current={state.answers.message} multiline dispatch={dispatch} />;
      if (state.currentStep === 3)
        return <ContactStep contactInfo={state.contactInfo} dispatch={dispatch} />;
      if (state.currentStep === 4)
        return <SummaryStep state={state} sourceContext={sourceContext} />;
    }

    return null;
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="font-mono text-xs text-neon-purple">portfolio</div>
          <div className="font-mono text-xs text-foreground/25">/</div>
          <div className="font-mono text-xs text-foreground/65">contato</div>
        </div>
        <h2 className="text-xl font-bold text-foreground-strong">{t("contactWizard.title")}</h2>
        {state.flow && !state.isSuccess && (
          <div className="mt-3">
            <ProgressBar current={state.currentStep} total={totalSteps} />
          </div>
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden relative min-h-[300px]">
        <AnimatePresence custom={state.direction} mode="wait">
          <motion.div
            key={`${state.currentStep}-${state.flow}`}
            custom={state.direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 overflow-y-auto"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {!state.isSuccess && (
        <div className="mt-6 flex items-center justify-between border-t border-foreground/10 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (state.currentStep === 0) onClose();
              else dispatch({ type: "PREV" });
            }}
            className="text-foreground/65 hover:text-foreground-strong font-mono text-xs"
          >
            <ArrowLeft className="mr-1.5 h-3 w-3" />
            {state.currentStep === 0 ? t("common.close") : t("contactWizard.back")}
          </Button>

          {isSummaryStep ? (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={state.isSubmitting}
              className="bg-neon-purple hover:bg-neon-purple/80 text-primary-foreground font-mono text-xs"
            >
              <Send className="mr-1.5 h-3 w-3" />
              {state.isSubmitting ? t("contactWizard.submitting") : t("contactWizard.submit")}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                if (state.currentStep === 0 && state.flow) dispatch({ type: "NEXT" });
                else if (canNext()) dispatch({ type: "NEXT" });
              }}
              disabled={!canNext()}
              className="bg-neon-purple hover:bg-neon-purple/80 text-primary-foreground font-mono text-xs disabled:opacity-40"
            >
              {t("contactWizard.next")}
              <ArrowRight className="ml-1.5 h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {state.isSuccess && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-foreground/20 text-foreground/65 hover:text-foreground-strong font-mono text-xs"
          >
            {t("common.close")}
          </Button>
        </div>
      )}
    </div>
  );
}
