type FilterTabsProps = {
  tabs: string[];
  selected?: string;
};

export function FilterTabs({ tabs, selected = tabs[0] }: FilterTabsProps) {
  return (
    <div className="inline-flex rounded-lg border border-[#d0d5dd] bg-surface p-1 shadow-sm">
      {tabs.map((tab) => {
        const active = tab === selected;

        return (
          <button
            key={tab}
            type="button"
            className={
              active
                ? "h-8 rounded-md bg-primary px-3 text-xs font-semibold text-white shadow-sm"
                : "h-8 rounded-md px-3 text-xs font-semibold text-muted transition hover:bg-soft-bg hover:text-navy"
            }
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
