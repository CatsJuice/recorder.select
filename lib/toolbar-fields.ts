import { fieldGroups, type FieldDefinition } from './recorders';

/** Include empty ancestors so nested field categories remain reachable. */
export function groupToolbarFields(fields: FieldDefinition[]) {
  const included = new Set<string>();
  for (const field of fields) {
    let group = fieldGroups.find(group => group.key === field.group);
    while (group) {
      included.add(group.key);
      group = fieldGroups.find(candidate => candidate.key === group?.parentKey);
    }
  }
  return fieldGroups.filter(group => included.has(group.key)).map(group => {
    let depth = 0;
    let parent = group.parentKey;
    while (parent) {
      depth += 1;
      parent = fieldGroups.find(candidate => candidate.key === parent)?.parentKey;
    }
    return { ...group, depth, fields: fields.filter(field => field.group === group.key) };
  });
}
