/** Tela de uma coleção: a lista, ou o editor quando há `?id=` ou `?novo=1`. */
import { useRouter } from "../lib/router";
import { COLLECTION_CONFIGS } from "./config";
import { CollectionEditor } from "./CollectionEditor";
import { CollectionList } from "./CollectionList";
import type { CollectionName } from "../../content/types";
import type { ReactNode } from "react";

export function CollectionScreen({ name, listExtras }: { name: CollectionName; listExtras?: { actions?: ReactNode; banner?: ReactNode } }) {
  const { search } = useRouter();
  const config = COLLECTION_CONFIGS[name];
  if (search.get("id") || search.get("novo")) return <CollectionEditor config={config} />;
  return <CollectionList config={config} extraActions={listExtras?.actions} banner={listExtras?.banner} />;
}
