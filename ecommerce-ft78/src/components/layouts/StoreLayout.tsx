import type { ReactNode } from "react";
interface StoreLayoutProps { header: ReactNode; children: ReactNode; }
export function StoreLayout({ header, children }: StoreLayoutProps) { return <div className="storefront">{header}{children}<footer className="store-footer">SpiderShop</footer></div>; }
