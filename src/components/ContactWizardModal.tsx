import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugin } from "@/contexts/PluginsContext";
import { ContactWizard } from "./ContactWizard";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export function ContactWizardModal() {
  const { isOpen, trigger, closeWizard } = useContactWizard();
  const wizardEnabled = usePlugin('contact-wizard');

  return (
    <Dialog open={isOpen && wizardEnabled} onOpenChange={(open) => { if (!open) closeWizard(); }}>
      <DialogContent className="sm:max-w-lg lg:max-w-2xl bg-background border border-foreground/10 p-6 max-h-[90vh] overflow-y-auto">
        <ContactWizard
          initialFlow={trigger.flowType}
          sourceContext={trigger.sourceContext}
          onClose={closeWizard}
        />
      </DialogContent>
    </Dialog>
  );
}
