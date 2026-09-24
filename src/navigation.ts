export interface SearchableCommand {
  id: string;
  title: string;
  description: string;
  keywords?: string[];
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ');
}

export function filterCommands<T extends SearchableCommand>(commands: T[], query: string): T[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return commands;

  const terms = normalizedQuery.split(' ');
  return commands.filter((command) => {
    const haystack = normalizeSearchText([
      command.title,
      command.description,
      ...(command.keywords ?? []),
    ].join(' '));
    return terms.every((term) => haystack.includes(term));
  });
}
