import { describe, it, expect } from "vitest";
import { watchMediaImages } from "@/lib/mediaImages";

describe("watchMediaImages", () => {
  it("quando o src muda, tira só o que o build acrescentou", async () => {
    document.body.innerHTML =
      '<img id="a" src="/media/a.webp" class="x" width="1600" height="900" srcset="/media/a-800.webp 800w" sizes="100vw" data-media="width height srcset sizes" alt="capa">' +
      '<img id="b" src="/media/b.webp" width="10" data-media="srcset" srcset="s 1w">';
    const observer = watchMediaImages(document.body);
    const a = document.getElementById("a")!;
    const b = document.getElementById("b")!;
    a.setAttribute("src", "/media/outra.webp");
    b.setAttribute("src", "/media/outra.webp");
    await new Promise((r) => setTimeout(r, 0));
    for (const name of ["width", "height", "srcset", "sizes", "data-media"]) expect(a.hasAttribute(name), name).toBe(false);
    expect(a.getAttribute("alt")).toBe("capa");
    expect(b.getAttribute("width")).toBe("10"); // definido pelo componente: fica
    expect(b.hasAttribute("srcset")).toBe(false);
    observer.disconnect();
  });
});
