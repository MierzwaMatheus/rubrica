import { lazy, Suspense, useState } from "react";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugin } from "@/contexts/PluginsContext";

/** O assistente só carrega quando o modal abre (não vai no JavaScript de todas as páginas). */
const ContactWizard = lazy(() => import("./ContactWizard").then((m) => ({ default: m.ContactWizard })));
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export function ContactWizardModal() {
  const { isOpen, trigger, closeWizard } = useContactWizard();
  const wizardEnabled = usePlugin('contact-wizard');
  const open = isOpen && wizardEnabled;
  const [loaded, setLoaded] = useState(open);
  if (open && !loaded) setLoaded(true);

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) closeWizard(); }}>
      <DialogContent className="sm:max-w-lg lg:max-w-2xl bg-background border border-foreground/10 p-6 max-h-[90vh] overflow-y-auto">
        {loaded && (
          <Suspense fallback={<div className="min-h-[320px]" aria-busy="true" />}>
            <ContactWizard
              initialFlow={trigger.flowType}
              sourceContext={trigger.sourceContext}
              onClose={closeWizard}
            />
          </Suspense>
        )}
      </DialogContent>
    </Dialog>
  );
}
