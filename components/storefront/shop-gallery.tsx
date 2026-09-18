"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, BadgeCheck, MapPin, Search, Store } from "lucide-react";
import type { DiscoverableShop } from "@/lib/db/discover-shops";
import styles from "./shop-gallery.module.css";

const PAGE_SIZE = 8;

export function ShopGallery({ shops }: { shops: DiscoverableShop[] }) {
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const provinces = [...new Set(shops.map(shop => shop.province).filter((value): value is string => Boolean(value)))].sort();
  const matches = shops.filter(shop =>
    (!province || shop.province === province) &&
    `${shop.name} ${shop.city ?? ""} ${shop.province ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <section id="meet-the-shops" className={styles.section} aria-labelledby="shops-title">
      <div className={styles.heading}>
        <div><p className={styles.kicker}>SMALL BUSINESSES. BIG POSSIBILITIES.</p><h2 id="shops-title">Meet the shops<span>.</span></h2>
          <p className={styles.intro}>A little window into their world. Find a shop that feels like you.</p>
        </div>
        <span className={styles.total}><Store size={16} aria-hidden="true" />{shops.length} shops to explore</span>
      </div>

      {shops.length > 0 ? <>
        <div className={styles.toolbar}>
          <label className={styles.search}><Search size={18} aria-hidden="true" /><input type="search" aria-label="Find a shop" placeholder="Find a shop or city…" value={query} onChange={event => { setQuery(event.target.value); setVisibleCount(PAGE_SIZE); }} /></label>
          <label className={styles.location}><MapPin size={17} aria-hidden="true" /><select aria-label="Filter shops by province" value={province} onChange={event => { setProvince(event.target.value); setVisibleCount(PAGE_SIZE); }}><option value="">All locations</option>{provinces.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <p className={styles.resultCount} role="status">{matches.length} {matches.length === 1 ? "shop" : "shops"}{query || province ? " found" : " · Pick your next stop"}</p>
        </div>
        <div className={styles.grid}>
          {matches.slice(0, visibleCount).map((shop, index) => (
            <Link key={shop.id} href={`/catalog/${shop.slug}`} prefetch={false} className={styles.card} data-tone={index % 4} aria-label={`Visit ${shop.name}, ${shop.productCount} products`}>
              <div className={styles.scene} aria-hidden="true">
                <span className={styles.sceneLabel}>THE SHOP EDIT</span>
                <span className={styles.orbit} />
                <div className={styles.stack}>
                  {[0, 1, 2].map(slot => <div className={styles.photo} key={slot} data-position={slot}>
                    {shop.previews[slot] ? <Image src={shop.previews[slot].imageUrl} alt="" fill sizes="(max-width: 600px) 42vw, 180px" className={styles.productImage} /> : <Store size={38} strokeWidth={1} />}
                  </div>)}
                </div>
                <span className={styles.count}>{shop.productCount} products</span>
                <span className={styles.openIcon}><ArrowUpRight size={20} /></span>
              </div>
              <div className={styles.details}>
                <span className={styles.avatar}>{shop.logoUrl ? <Image src={shop.logoUrl} alt="" fill sizes="44px" /> : shop.name.slice(0, 1).toUpperCase()}</span>
                <div className={styles.identity}><h3>{shop.name}{shop.isVerified && <BadgeCheck size={17} aria-label="Verified seller" />}</h3><p><MapPin size={12} aria-hidden="true" />{shop.city || shop.province || "South Africa"}</p></div>
              </div>
              <div className={styles.cardFooter}><span>Step inside</span><ArrowUpRight size={16} aria-hidden="true" /></div>
            </Link>
          ))}
        </div>
        {matches.length === 0 && <div className={styles.empty}><Store size={30} aria-hidden="true" /><h3>No shops match just yet.</h3><p>Try another name or explore all locations.</p><button type="button" onClick={() => { setQuery(""); setProvince(""); setVisibleCount(PAGE_SIZE); }}>Show all shops</button></div>}
        {matches.length > visibleCount && <div className={styles.more}><button type="button" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>Explore more shops <ArrowDown size={17} aria-hidden="true" /></button><span>Showing {Math.min(visibleCount, matches.length)} of {matches.length}</span></div>}
      </> : <p className={styles.empty}>New shop collections are on their way. <Link href="/marketplace">Explore the marketplace</Link>.</p>}
    </section>
  );
}
