export default function EmptyState({ message, subtext }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-lg font-medium text-text-primary">{message || "Nothing here."}</h3>
            {subtext && <p className="text-text-secondary mt-1">{subtext}</p>}
        </div>
    );
}
