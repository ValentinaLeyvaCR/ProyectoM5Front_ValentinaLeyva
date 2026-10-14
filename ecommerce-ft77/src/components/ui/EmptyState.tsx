interface EmptyStateProps { message: string; }
export function EmptyState({ message }: EmptyStateProps) { return <p className="empty-message" role="status">{message}</p>; }
