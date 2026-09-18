import { ShopGallery } from "./shop-gallery";
import type { DiscoverableShop } from "@/lib/db/discover-shops";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  MapPin,
  UserRound,
  PackageSearch,
  MessageCircle,
  Store,
  Shirt,
  Footprints,
  Gem,
  Smartphone,
  Laptop,
  Armchair,
  Sparkles,
  ShoppingBag,
  BadgeCheck,
  Baby,
  Shapes,
  BriefcaseBusiness,
} from "lucide-react";
import type {
  MarketplaceProduct,
  CategoryWithCount,
} from "@/lib/db/marketplace";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { TfThemeToggle } from "@/components/tf/theme-toggle";
import { TfFonts } from "@/components/tf/tf-fonts";
import { formatZAR } from "@/components/tf/format";
import styles from "./storefront.module.css";

const productHref = (p: MarketplaceProduct) =>
  `/catalog/${p.shop.slug}/products/${p.slug ?? p.id}`;
function categoryIcon(slug: string) {
  if (/kids|baby/.test(slug)) return Baby;
  if (/unisex/.test(slug)) return Shapes;
  if (/formal/.test(slug)) return BriefcaseBusiness;
  if (/women/.test(slug)) return ShoppingBag;
  if (/foot|shoe/.test(slug)) return Footprints;
  if (/phone|tablet/.test(slug)) return Smartphone;
  if (/computer|laptop|electronic/.test(slug)) return Laptop;
  if (/accessor|jewel/.test(slug)) return Gem;
  if (/home|furniture/.test(slug)) return Armchair;
  if (/beauty|health/.test(slug)) return Sparkles;
  if (/cloth|fashion|men|women|unisex|formal|baby/.test(slug)) return Shirt;
  return ShoppingBag;
}
function productSelection(products: MarketplaceProduct[]) {
  const selected: MarketplaceProduct[] = [];
  const selectedShops = new Set<string>();
  for (const product of products) {
    const shopId = product.shop.id;
    if (!product.imageUrl || selectedShops.has(shopId)) continue;
    selected.push(product);
    selectedShops.add(shopId);
    if (selected.length === 3) return selected;
  }
  for (const product of products) {
    if (product.imageUrl && !selected.some((p) => p.id === product.id))
      selected.push(product);
    if (selected.length === 3) break;
  }
  return selected;
}

export function Storefront({
  products,
  categories,
  shops,
}: {
  products: MarketplaceProduct[];
  categories: CategoryWithCount[];
  shops: DiscoverableShop[];
}) {
  const hero = productSelection(products);
  const availableCategories = categories
    .filter((c) => c.productCount > 0)
    .slice(0, 8);
  return (
    <div className={styles.page}>
      <TfFonts />
      <div className={styles.announcement}>
        <span>
          <MapPin size={13} aria-hidden="true" /> Independent shops. All across
          South Africa.
        </span>
        <Link href="/sell">
          Your shop could be next <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
      </div>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <Link href="/" aria-label="TradeFeed home" className={styles.logo}>
            <TradeFeedLogo size="md" variant="auto" />
          </Link>
          <form action="/marketplace" role="search" className={styles.search}>
            <Search size={19} aria-hidden="true" />
            <input
              name="search"
              type="search"
              aria-label="Search products"
              placeholder="What are you looking for today?"
            />
            <button type="submit" aria-label="Search products">
              <ArrowRight size={20} aria-hidden="true" />
            </button>
          </form>
          <nav aria-label="Account and orders" className={styles.utilities}>
            <Link href="/track" aria-label="Track order">
              <PackageSearch size={20} aria-hidden="true" />
              <span>Track order</span>
            </Link>
            <Link href="/me" aria-label="Account">
              <UserRound size={20} aria-hidden="true" />
              <span>Account</span>
            </Link>
            <TfThemeToggle className="size-11" />
          </nav>
        </div>
        <div className={styles.navRow}>
          <nav aria-label="Main navigation">
            <Link href="/marketplace" className={styles.navActive}>
              Shop everything
            </Link>
            {availableCategories.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                href={`/marketplace?category=${encodeURIComponent(c.slug)}`}
              >
                {c.name}
              </Link>
            ))}
          </nav>
          <Link className={styles.helpLink} href="/support/order">
            Need a hand? <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </header>
      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span /> A marketplace with a local heart
            </p>
            <h1 id="home-title">
              Good finds.
              <br />
              <em>Great stories.</em>
              <br />
              Closer to home.
            </h1>
            <p className={styles.heroDescription}>
              Discover something you love from an independent South African
              business. Everyday essentials to a little out of the ordinary.
            </p>
            <Link href="/marketplace" className={styles.heroCta}>
              Find your next favourite{" "}
              <ArrowUpRight size={19} aria-hidden="true" />
            </Link>
            <div className={styles.heroFoot}>
              <span className={styles.smallMark}>
                <Store size={17} aria-hidden="true" />
              </span>
              <span>
                Real shops. Direct conversations.
                <br />
                <strong>A more personal way to shop.</strong>
              </span>
            </div>
          </div>
          <div className={styles.heroGallery}>
            <div className={styles.galleryHeading}>
              <span>THE DISCOVERY EDIT</span>
              <span>
                Made for browsing <ArrowUpRight size={14} aria-hidden="true" />
              </span>
            </div>
            {hero.length > 0 ? (
              <div
                className={`${styles.heroTiles} ${hero.length === 1 ? styles.singleTile : hero.length === 2 ? styles.twoTiles : ""}`}
              >
                {hero.map((p, index) => (
                  <Link
                    key={p.id}
                    href={productHref(p)}
                    className={`${styles.heroTile} ${index === 0 ? styles.heroTileMain : ""}`}
                  >
                    <div className={styles.heroPhoto}>
                      <Image
                        src={p.imageUrl!}
                        alt={p.name}
                        fill
                        priority={index === 0}
                        sizes={
                          index === 0
                            ? "(min-width: 1100px) 330px, (min-width: 700px) 30vw, 55vw"
                            : "(min-width: 1100px) 220px, 35vw"
                        }
                        className={styles.containImage}
                      />
                      <span className={styles.photoArrow}>
                        <ArrowUpRight size={18} aria-hidden="true" />
                      </span>
                    </div>
                    <div className={styles.heroCaption}>
                      <span>
                        {p.globalCategory?.name ?? "Discover a local find"}
                      </span>
                      <h2>{p.name}</h2>
                      <strong>
                        {p.minPriceCents !== p.maxPriceCents ? "From " : ""}
                        {formatZAR(p.minPriceCents / 100)}
                      </strong>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.noHero}>
                <ShoppingBag size={52} strokeWidth={1} />
                <h2>Your next discovery starts here.</h2>
                <Link href="/marketplace">
                  Explore the marketplace <ArrowRight size={18} />
                </Link>
              </div>
            )}
            <p className={styles.galleryFoot}>
              A few finds from the marketplace. Plenty more to discover.
            </p>
          </div>
        </section>
        <div className={styles.howStrip} aria-label="Shopping on TradeFeed">
          <div>
            <Store size={21} aria-hidden="true" />
            <span>
              <strong>Discover independent shops</strong>
              <small>Get to know the business behind the product.</small>
            </span>
          </div>
          <div>
            <MessageCircle size={21} aria-hidden="true" />
            <span>
              <strong>Talk directly to the seller</strong>
              <small>Ask about availability, payment and delivery.</small>
            </span>
          </div>
          <div>
            <PackageSearch size={21} aria-hidden="true" />
            <span>
              <strong>Keep your order close</strong>
              <small>Track TradeFeed orders and get help when needed.</small>
            </span>
          </div>
        </div>
        {availableCategories.length > 0 && (
          <section
            className={styles.section}
            aria-labelledby="categories-title"
          >
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionKicker}>FOLLOW YOUR CURIOSITY</p>
                <h2 id="categories-title">What are you in the mood for?</h2>
              </div>
              <Link href="/marketplace">
                All categories <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.categories}>
              {availableCategories.map((c, i) => {
                const Icon = categoryIcon(c.slug);
                return (
                  <Link
                    key={c.id}
                    href={`/marketplace?category=${encodeURIComponent(c.slug)}`}
                    className={styles.category}
                  >
                    <span className={styles.categoryVisual} data-tone={i % 4}>
                      {c.imageUrl ? (
                        <Image
                          src={c.imageUrl}
                          alt=""
                          fill
                          sizes="140px"
                          className={styles.containImage}
                        />
                      ) : (
                        <Icon size={35} strokeWidth={1.25} aria-hidden="true" />
                      )}
                    </span>
                    <strong>{c.name}</strong>
                    <span>
                      Explore <ArrowUpRight size={12} aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
        <section className={styles.section} aria-labelledby="products-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionKicker}>MEET YOUR NEXT FAVOURITE</p>
              <h2 id="products-title">Worth a closer look.</h2>
              <p>A little inspiration from shops on TradeFeed.</p>
            </div>
            <Link href="/marketplace">
              Explore everything <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.products}>
            {products.slice(0, 8).map((p) => (
              <article key={p.id} className={styles.productCard}>
                <Link href={productHref(p)} className={styles.productLink}>
                  <div className={styles.productImage}>
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        sizes="(min-width: 1200px) 290px, (min-width: 700px) 30vw, 45vw"
                        className={styles.containImage}
                      />
                    ) : (
                      <ShoppingBag
                        size={35}
                        strokeWidth={1}
                        aria-hidden="true"
                      />
                    )}
                    <span className={styles.productHover}>
                      Take a closer look{" "}
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </span>
                  </div>
                  <div className={styles.productDetails}>
                    <p>{p.globalCategory?.name ?? "Independent finds"}</p>
                    <h3>{p.name}</h3>
                    <strong>
                      {p.minPriceCents !== p.maxPriceCents ? "From " : ""}
                      {formatZAR(p.minPriceCents / 100)}
                    </strong>
                    <div className={styles.sellerLine}>
                      <span>{p.shop.name}</span>
                      {p.shop.isVerified && (
                        <BadgeCheck size={14} aria-label="Verified seller" />
                      )}
                    </div>
                    {(p.shop.city || p.shop.province) && (
                      <small>
                        <MapPin size={11} aria-hidden="true" />
                        {p.shop.city ?? p.shop.province}
                      </small>
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>
          {products.length === 0 && (
            <p className={styles.empty}>
              There are no products to show here yet.{" "}
              <Link href="/marketplace">
                Check the marketplace for availability.
              </Link>
            </p>
          )}
        </section>
        <section className={styles.localStory}>
          <div className={styles.storyMark} aria-hidden="true">
            <Store size={52} strokeWidth={1} />
            <span>
              LOCAL
              <br />
              LOOKS GOOD.
            </span>
          </div>
          <div>
            <p className={styles.sectionKicker}>MORE THAN A PRODUCT</p>
            <h2>
              Behind every find,
              <br />
              there&apos;s a business.
            </h2>
            <p>
              Meet the people building something of their own. Browse their
              collections, ask a question, and find your next favourite shop.
            </p>
            <a href="#meet-the-shops">
              Get to know the shops{" "}
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
        <ShopGallery shops={shops} />
        <section className={styles.sellerBanner}>
          <div>
            <p className={styles.eyebrow}>
              FOR THE DOERS, MAKERS &amp; BUSINESS OWNERS
            </p>
            <h2>
              Your next customer
              <br />
              could be right here.
            </h2>
            <p>
              Give your products a home online. Build your shop on TradeFeed.
            </p>
          </div>
          <Link href="/sell">
            Start your shop <ArrowUpRight size={20} aria-hidden="true" />
          </Link>
        </section>
        <div className={styles.huntNote}>
          <span>Can&apos;t find what you have in mind?</span>
          <Link href="/hunt#start-hunt">
            Start a TradeFeed HUNT <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerMain}>
          <div>
            <Link href="/" aria-label="TradeFeed home">
              <TradeFeedLogo variant="auto" />
            </Link>
            <p>
              Good finds. Real connections.
              <br />A marketplace with a local heart.
            </p>
            <span>South Africa</span>
          </div>
          <div>
            <h2>Find your way</h2>
            <Link href="/marketplace">Shop the marketplace</Link>
            <Link href="/track">Track your order</Link>
            <Link href="/me">Your account</Link>
          </div>
          <div>
            <h2>We&apos;re here to help</h2>
            <Link href="/support/order">Order help</Link>
            <Link href="/contact">Contact TradeFeed</Link>
            <Link href="/sell">Sell on TradeFeed</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>TradeFeed · Independent shops, connected.</span>
          <nav aria-label="Legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
