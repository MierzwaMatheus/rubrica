/** Esconde um pedaço opcional da interface se ele quebrar (ex.: backend sem o módulo). */
import { Component, type ReactNode } from "react";

export class QuietBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
