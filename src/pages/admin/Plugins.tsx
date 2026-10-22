import { AdminLayout } from './Dashboard';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { PLUGIN_REGISTRY, PluginDefinition } from '../../../convex/pluginRegistry';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { GitBranch } from 'lucide-react';

export default function Plugins() {
  const states = useQuery(api.plugins.getPluginStates);
  const setEnabled = useMutation(api.plugins.setPluginEnabled);

  const handleToggle = async (pluginId: string, enabled: boolean) => {
    try {
      await setEnabled({ pluginId, enabled });
      toast.success(`Plugin ${enabled ? 'ativado' : 'desativado'} com sucesso`);
    } catch (err) {
      toast.error('Erro ao alterar plugin');
    }
  };

  const rootPlugins = PLUGIN_REGISTRY.filter(p => !p.parentId);
  const childrenOf = (id: string) => PLUGIN_REGISTRY.filter(p => p.parentId === id);

  const renderPlugin = (plugin: PluginDefinition, isChild = false) => {
    const enabled = states ? (states[plugin.id] ?? plugin.defaultEnabled) : plugin.defaultEnabled;
    const parentEnabled = plugin.parentId
      ? (states ? (states[plugin.parentId] ?? true) : true)
      : true;
    const toggleDisabled = states === undefined || (!isChild ? false : !parentEnabled);

    return (
      <div key={plugin.id} className={isChild ? 'ml-6 mt-3' : ''}>
        <div
          className={`bg-card border rounded-xl p-6 flex flex-col gap-4 ${
            isChild ? 'border-foreground/5 bg-white/[0.02]' : 'border-foreground/10'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {isChild && (
                  <GitBranch className="w-3.5 h-3.5 text-foreground/42 flex-shrink-0" />
                )}
                <h3 className="font-semibold text-foreground-strong">{plugin.label}</h3>
                <Badge
                  variant="outline"
                  className="text-xs border-foreground/20 text-foreground/65"
                >
                  {plugin.minRole}
                </Badge>
                {isChild && (
                  <Badge
                    variant="outline"
                    className="text-xs border-foreground/10 text-foreground/42"
                  >
                    sub-plugin
                  </Badge>
                )}
              </div>
              <p className="text-sm text-foreground/65 mt-1">{plugin.description}</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Switch
                    checked={enabled && parentEnabled}
                    onCheckedChange={val => handleToggle(plugin.id, val)}
                    disabled={toggleDisabled}
                  />
                </span>
              </TooltipTrigger>
              {isChild && !parentEnabled && (
                <TooltipContent>
                  Ative o plugin pai "{PLUGIN_REGISTRY.find(p => p.id === plugin.parentId)?.label}" primeiro
                </TooltipContent>
              )}
            </Tooltip>
          </div>

          {plugin.tables.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {plugin.tables.map(table => (
                <span
                  key={table}
                  className="text-xs bg-foreground/5 text-foreground/42 px-2 py-0.5 rounded font-mono"
                >
                  {table}
                </span>
              ))}
            </div>
          )}
        </div>

        {childrenOf(plugin.id).map(child => renderPlugin(child, true))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-foreground-strong">Plugins</h1>
          <p className="text-foreground/65 mt-2">
            Ative ou desative funcionalidades independentes do sistema.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rootPlugins.map(plugin => renderPlugin(plugin))}
        </div>
      </div>
    </AdminLayout>
  );
}
