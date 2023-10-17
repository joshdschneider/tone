import { Variable } from '../types';

export function injectContext(
  prompt: string | null,
  variables: Variable[],
  context: any
): string | null {
  if (!prompt) {
    return null;
  }

  function normalizeKey(key: string): string {
    key = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
    return key.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  }

  const normalizedContext: { [key: string]: any } = {};
  for (const key in context) {
    if (context.hasOwnProperty(key)) {
      normalizedContext[normalizeKey(key)] = context[key];
    }
  }

  const varMap = new Map<string, Variable>();
  variables.forEach((v) =>
    varMap.set(v.id, {
      ...v,
      name: normalizeKey(v.name),
    })
  );

  return prompt.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, varId) => {
    const variable = varMap.get(varId);

    if (!variable) {
      return match;
    }

    if (normalizedContext.hasOwnProperty(variable.name)) {
      return normalizedContext[variable.name];
    }

    if (variable.fallback !== null) {
      return variable.fallback;
    }

    const originalVar = variables.find((v) => v.id === varId);
    return `[${originalVar ? originalVar.name : 'unknown'}]`;
  });
}
