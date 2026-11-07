import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const loaded = vi.hoisted(() => ({ count: 0 }));
vi.mock("@/components/TestimonialWizardDialog", () => {
  loaded.count++;
  return { TestimonialWizardDialog: ({ open }: { open: boolean }) => <div>assistente {open ? "aberto" : "fechado"}</div> };
});

import { TestimonialWizard } from "@/components/TestimonialWizard";

describe("TestimonialWizard — carrega só ao abrir", () => {
  it("fechado, não carrega o assistente; aberto, carrega; fechado de novo, continua montado", async () => {
    const { rerender, container } = render(<TestimonialWizard open={false} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
    expect(loaded.count).toBe(0);

    rerender(<TestimonialWizard open onClose={() => {}} />);
    expect(await screen.findByText("assistente aberto")).toBeInTheDocument();
    expect(loaded.count).toBe(1);

    rerender(<TestimonialWizard open={false} onClose={() => {}} />);
    expect(screen.getByText("assistente fechado")).toBeInTheDocument();
  });
});
