interface PlaceholderProps {
    page: string;
}

export function Placeholder({ page }: PlaceholderProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-lg font-mono font-semibold">
                    {page[0]}
                </span>
            </div>
            <p className="text-foreground font-medium">{page}</p>
            <p className="text-sm text-muted-foreground">Coming in Phase F-2</p>
        </div>
    );
}