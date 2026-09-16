-- Fresh-database baseline of main 47cc159. Never run against a populated database.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EmailMarketingConsentStatus" AS ENUM ('UNKNOWN', 'OPTED_IN', 'OPTED_OUT');

-- CreateEnum
CREATE TYPE "EmailSuppressionReason" AS ENUM ('UNSUBSCRIBED', 'HARD_BOUNCE', 'COMPLAINT', 'PROVIDER_SUPPRESSED', 'NCC_OPT_OUT', 'INVALID_ADDRESS', 'ADMIN');

-- CreateEnum
CREATE TYPE "EmailMarketingCampaignKind" AS ENUM ('SELLER_REENGAGEMENT', 'FEATURE_ANNOUNCEMENT', 'CONSENT_REQUEST', 'OTHER');

-- CreateEnum
CREATE TYPE "EmailMarketingCampaignStatus" AS ENUM ('DRAFT', 'APPROVED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmailMarketingRecipientStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'SUPPRESSED', 'BOUNCED', 'COMPLAINED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "VideoSource" AS ENUM ('UPLOAD', 'YOUTUBE', 'DIRECT');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PAGE_VIEW', 'PRODUCT_VIEW', 'WHATSAPP_CLICK', 'WHATSAPP_CHECKOUT', 'ADD_TO_CART', 'CHECKOUT_START', 'PAYMENT_COMPLETE', 'MARKETPLACE_VIEW', 'MARKETPLACE_CLICK', 'PROMOTED_IMPRESSION', 'PROMOTED_CLICK');

-- CreateEnum
CREATE TYPE "UpgradeStatus" AS ENUM ('NONE', 'REQUESTED', 'AWAITING_PAYMENT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING');

-- CreateEnum
CREATE TYPE "PromotionTier" AS ENUM ('BOOST', 'FEATURED', 'SPOTLIGHT');

-- CreateEnum
CREATE TYPE "PromotedListingStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderMessageSender" AS ENUM ('BUYER', 'SELLER');

-- CreateEnum
CREATE TYPE "ShippingMethod" AS ENUM ('SELLER_ARRANGED', 'COLLECTION', 'PLATFORM_COURIER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAYFAST', 'COD', 'MANUAL');

-- CreateEnum
CREATE TYPE "GalleryMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "BulkImportStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DropStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WholesaleBuyerStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProductSource" AS ENUM ('WEB', 'WHATSAPP', 'CSV', 'API', 'IMPORT');

-- CreateEnum
CREATE TYPE "WhatsAppImportStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportSource" AS ENUM ('PHOTOS', 'TEXT', 'CSV', 'WA_CATALOG');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('PROCESSING', 'REVIEW', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('PROCESSING', 'NEEDS_REVIEW', 'READY', 'PUBLISHED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "HuntStatus" AS ENUM ('LIVE', 'FOUND', 'CLOSED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "HuntModerationStatus" AS ENUM ('APPROVED', 'REVIEW_REQUIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "HuntMatchPreference" AS ENUM ('EXACT_ONLY', 'SIMILAR_OK');

-- CreateEnum
CREATE TYPE "HuntFulfillmentStatus" AS ENUM ('NONE', 'OFFER_SELECTED', 'HANDOFF_SENT', 'FULFILLED');

-- CreateEnum
CREATE TYPE "HuntOfferStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'WITHDRAWN', 'REJECTED');

-- CreateEnum
CREATE TYPE "HuntOfferMatchType" AS ENUM ('EXACT', 'SIMILAR', 'UNCERTAIN');

-- CreateEnum
CREATE TYPE "HuntSellerRouteStatus" AS ENUM ('ROUTED', 'CONTACTED', 'RESPONDED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HuntEventType" AS ENUM ('VIEWED', 'CREATE_STARTED', 'CREATED', 'SHARED', 'JOINED', 'SELLER_ROUTED', 'SELLER_RESPONDED', 'OFFER_PUBLISHED', 'OFFER_WITHDRAWN', 'OFFER_SELECTED', 'WHATSAPP_HANDOFF', 'FULFILLED', 'CLOSED', 'REPORTED', 'TAKEN_DOWN');

-- CreateEnum
CREATE TYPE "HuntEventActor" AS ENUM ('BUYER', 'SELLER', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "HuntReportReason" AS ENUM ('SCAM_OR_FRAUD', 'PROHIBITED_ITEM', 'COPYRIGHT_OR_TRADEMARK', 'PRIVACY', 'MISLEADING', 'SPAM', 'OTHER');

-- CreateEnum
CREATE TYPE "HuntReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'ACTIONED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "HuntTakedownAction" AS ENUM ('HIDDEN', 'RESTORED');

-- CreateEnum
CREATE TYPE "HuntRateLimitScope" AS ENUM ('DEVICE', 'NETWORK');

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "whatsappNumber" TEXT NOT NULL,
    "retailWhatsappNumber" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isFeaturedShop" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationProvider" TEXT,
    "locationGeocodedAt" TIMESTAMP(3),
    "locationPublishedAt" TIMESTAMP(3),
    "aboutText" TEXT,
    "businessHours" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "tiktok" TEXT,
    "website" TEXT,
    "whatsappGroupLink" TEXT,
    "referralCode" TEXT,
    "referredBy" TEXT,
    "aiGenerationsUsed" INTEGER NOT NULL DEFAULT 0,
    "healthScore" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "codEnabled" BOOLEAN NOT NULL DEFAULT false,
    "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "collectionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dispatchWindow" TEXT NOT NULL DEFAULT '1-2 business days',
    "deliveryNote" TEXT,
    "returnPolicy" TEXT,
    "themePreset" TEXT,
    "themePrimary" TEXT,
    "themeAccent" TEXT,
    "themeFont" TEXT,
    "customDomain" TEXT,
    "domainStatus" TEXT,
    "domainVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "bannedReason" TEXT,
    "bannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMarketingPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "EmailMarketingConsentStatus" NOT NULL DEFAULT 'UNKNOWN',
    "consentSource" TEXT,
    "consentVersion" TEXT,
    "consentRequestedAt" TIMESTAMP(3),
    "consentedAt" TIMESTAMP(3),
    "optedOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailMarketingPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSuppression" (
    "id" TEXT NOT NULL,
    "normalizedEmailHash" CHAR(64) NOT NULL,
    "reason" "EmailSuppressionReason" NOT NULL,
    "source" TEXT,
    "providerEventId" TEXT,
    "suppressedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSuppression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMarketingCampaign" (
    "id" TEXT NOT NULL,
    "campaignKey" TEXT NOT NULL,
    "kind" "EmailMarketingCampaignKind" NOT NULL,
    "status" "EmailMarketingCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "templateHash" CHAR(64) NOT NULL,
    "audienceDefinition" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "eligibleCount" INTEGER NOT NULL DEFAULT 0,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "suppressedCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailMarketingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMarketingCampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT,
    "normalizedEmailHash" CHAR(64) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "EmailMarketingRecipientStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "providerMessageId" TEXT,
    "lastAttemptAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "suppressedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailMarketingCampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopUser" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "userId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffInvite" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "token" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "acceptedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" "ProductSource" NOT NULL DEFAULT 'WEB',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "flaggedAt" TIMESTAMP(3),
    "shopId" TEXT NOT NULL,
    "categoryId" TEXT,
    "globalCategoryId" TEXT,
    "option1Label" TEXT NOT NULL DEFAULT 'Size',
    "option2Label" TEXT NOT NULL DEFAULT 'Color',
    "minWholesaleQty" INTEGER NOT NULL DEFAULT 1,
    "wholesaleOnly" BOOLEAN NOT NULL DEFAULT false,
    "minPriceCents" INTEGER NOT NULL DEFAULT 0,
    "maxPriceCents" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "search_vector" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT,
    "altText" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVideo" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" "VideoSource" NOT NULL,
    "key" TEXT,
    "thumbnailUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT,
    "priceInCents" INTEGER NOT NULL,
    "retailPriceCents" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "shopId" TEXT NOT NULL,
    "productId" TEXT,
    "visitorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "priceInCents" INTEGER NOT NULL DEFAULT 0,
    "productLimit" INTEGER NOT NULL DEFAULT 20,
    "staffLimit" INTEGER NOT NULL DEFAULT 1,
    "features" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "shopId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "payfastToken" TEXT,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "upgradeStatus" "UpgradeStatus" NOT NULL DEFAULT 'NONE',
    "requestedPlanSlug" TEXT,
    "manualPaymentMethod" TEXT,
    "paymentReference" TEXT,
    "proofOfPaymentUrl" TEXT,
    "adminNote" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualPaymentMethod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "imageUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotedListing" (
    "id" TEXT NOT NULL,
    "tier" "PromotionTier" NOT NULL,
    "status" "PromotedListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "shopId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "amountPaidCents" INTEGER NOT NULL DEFAULT 0,
    "payfastPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotedListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "shopId" TEXT NOT NULL,
    "buyerClerkId" TEXT,
    "buyerName" TEXT,
    "buyerPhone" TEXT,
    "buyerNote" TEXT,
    "deliveryAddress" TEXT,
    "deliveryCity" TEXT,
    "deliveryProvince" TEXT,
    "deliveryPostalCode" TEXT,
    "totalCents" INTEGER NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'PAYFAST',
    "paymentRequestedAt" TIMESTAMP(3),
    "paymentLinkUrl" TEXT,
    "paymentLinkExpiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "codConfirmedAt" TIMESTAMP(3),
    "whatsappSent" BOOLEAN NOT NULL DEFAULT true,
    "whatsappMessage" TEXT,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "shippingMethod" "ShippingMethod" NOT NULL DEFAULT 'SELLER_ARRANGED',
    "courierName" TEXT,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "shippingCostCents" INTEGER NOT NULL DEFAULT 0,
    "estimatedDelivery" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "option1Label" TEXT NOT NULL DEFAULT 'Size',
    "option1Value" TEXT NOT NULL,
    "option2Label" TEXT NOT NULL DEFAULT 'Color',
    "option2Value" TEXT,
    "priceInCents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderMessage" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "senderType" "OrderMessageSender" NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "body" VARCHAR(1500) NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionFee" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "orderAmountCents" INTEGER NOT NULL,
    "feeCents" INTEGER NOT NULL,
    "feeType" TEXT NOT NULL DEFAULT 'flat',
    "payfastPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayfastNotification" (
    "id" TEXT NOT NULL,
    "pfPaymentId" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "mPaymentId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayfastNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productName" TEXT,
    "visitorId" TEXT,
    "userId" TEXT,
    "notifyPhone" TEXT,
    "restockNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopGalleryItem" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT,
    "type" "GalleryMediaType" NOT NULL DEFAULT 'IMAGE',
    "caption" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopGalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "shopId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "orderNotifications" BOOLEAN NOT NULL DEFAULT true,
    "lowStockAlerts" BOOLEAN NOT NULL DEFAULT true,
    "reviewNotifications" BOOLEAN NOT NULL DEFAULT true,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "notificationEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkImportJob" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" "BulkImportStatus" NOT NULL DEFAULT 'PROCESSING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComboCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComboCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Combo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "retailPriceCents" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "shopId" TEXT NOT NULL,
    "comboCategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Combo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComboItem" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "productName" TEXT NOT NULL,
    "variantLabel" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ComboItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComboImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT,
    "altText" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "comboId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComboImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drop" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "DropStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Drop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DropItem" (
    "id" TEXT NOT NULL,
    "dropId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "priceSnapshot" INTEGER NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "DropItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerPreferences" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "brandTone" TEXT,
    "brandDescription" TEXT,
    "defaultCategory" TEXT,
    "preferredTags" TEXT[],
    "priceRange" TEXT,
    "targetAudience" TEXT,
    "languagePreference" TEXT NOT NULL DEFAULT 'en',
    "aiToneNotes" TEXT,
    "autoReplyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoReplyStartHour" INTEGER NOT NULL DEFAULT 8,
    "autoReplyEndHour" INTEGER NOT NULL DEFAULT 22,
    "whatsappImportEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerMessage" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "recipientPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerSequenceState" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "welcomeSentAt" TIMESTAMP(3),
    "nudgeProductSentAt" TIMESTAMP(3),
    "nudgeShareSentAt" TIMESTAMP(3),
    "nudgeInactiveSentAt" TIMESTAMP(3),
    "lastMonthlySentAt" TIMESTAMP(3),
    "lastWeeklySentAt" TIMESTAMP(3),
    "optedOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerSequenceState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppConversation" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "intent" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesaleBuyer" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT,
    "vatNumber" TEXT,
    "registrationNumber" TEXT,
    "city" TEXT,
    "province" TEXT,
    "status" "WholesaleBuyerStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WholesaleBuyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkDiscountTier" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkDiscountTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "referrerShopId" TEXT NOT NULL,
    "referredShopId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL DEFAULT 'FREE_MONTH',
    "daysExtended" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppProductImport" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "imageMediaId" TEXT NOT NULL,
    "captionText" TEXT,
    "status" "WhatsAppImportStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "productId" TEXT,
    "parsedPrice" INTEGER,
    "parsedSizes" TEXT[],
    "aiProductName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppProductImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankingFactor" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "viewScore" DOUBLE PRECISION NOT NULL,
    "orderScore" DOUBLE PRECISION NOT NULL,
    "ratingScore" DOUBLE PRECISION NOT NULL,
    "freshnessScore" DOUBLE PRECISION NOT NULL,
    "sellerTierScore" DOUBLE PRECISION NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankingFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "metadata" JSONB,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "source" "ImportSource" NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PROCESSING',
    "globalContext" TEXT,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "readyItems" INTEGER NOT NULL DEFAULT 0,
    "publishedItems" INTEGER NOT NULL DEFAULT 0,
    "skippedItems" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftListing" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "status" "DraftStatus" NOT NULL DEFAULT 'PROCESSING',
    "aiTitle" TEXT,
    "aiDescription" TEXT,
    "aiCategory" TEXT,
    "aiPriceMinCents" INTEGER,
    "aiPriceMaxCents" INTEGER,
    "aiAttributes" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "flags" TEXT[],
    "originalCaption" TEXT,
    "photoUrls" TEXT[],
    "photoKeys" TEXT[],
    "publishedProductId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DraftListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTranslation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerVerification" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "legalName" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "vatNumber" TEXT,
    "idDocumentUrl" TEXT,
    "proofOfAddressUrl" TEXT,
    "sellerNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedByEmail" TEXT,
    "decisionNote" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "reviewId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerProfile" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "phone" TEXT,
    "displayName" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "orderUpdates" BOOLEAN NOT NULL DEFAULT true,
    "restockAlerts" BOOLEAN NOT NULL DEFAULT true,
    "shopUpdates" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerAddress" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Home',
    "recipientName" TEXT NOT NULL,
    "phone" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "deliveryInstructions" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerNotification" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopFollow" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopActivityLog" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hunt" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "HuntStatus" NOT NULL DEFAULT 'LIVE',
    "moderationStatus" "HuntModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "fulfillmentStatus" "HuntFulfillmentStatus" NOT NULL DEFAULT 'NONE',
    "selectedOfferId" TEXT,
    "publicTitle" TEXT NOT NULL,
    "publicDescription" TEXT NOT NULL,
    "publicImageUrl" TEXT NOT NULL,
    "publicImageKey" TEXT,
    "category" TEXT,
    "desiredVariant" TEXT,
    "desiredColor" TEXT,
    "style" TEXT,
    "matchPreference" "HuntMatchPreference" NOT NULL DEFAULT 'SIMILAR_OK',
    "maxBudgetCents" INTEGER,
    "city" TEXT NOT NULL,
    "province" TEXT,
    "aiConfidence" DOUBLE PRECISION,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "seoApprovedAt" TIMESTAMP(3),
    "handoffAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hunt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuntPrivateData" (
    "id" TEXT NOT NULL,
    "huntId" TEXT NOT NULL,
    "ownerFeatureId" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "buyerName" TEXT,
    "rawRequestText" TEXT NOT NULL,
    "huntUpdatesConsentAt" TIMESTAMP(3) NOT NULL,
    "publicImageConsentAt" TIMESTAMP(3) NOT NULL,
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
    "purgeAfter" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HuntPrivateData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuntParticipant" (
    "id" TEXT NOT NULL,
    "huntId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HuntParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuntOffer" (
    "id" TEXT NOT NULL,
    "huntId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "status" "HuntOfferStatus" NOT NULL DEFAULT 'DRAFT',
    "matchType" "HuntOfferMatchType" NOT NULL,
    "publicProductName" TEXT NOT NULL,
    "publicDescription" TEXT,
    "publicVariant" TEXT,
    "publicDeliveryEstimate" TEXT NOT NULL,
    "publicProofUrl" TEXT,
    "publicProofCapturedAt" TIMESTAMP(3),
    "priceCents" INTEGER NOT NULL,
    "quantityAvailable" INTEGER,
    "publicSellerNameSnapshot" TEXT NOT NULL,
    "publicShopSlugSnapshot" TEXT NOT NULL,
    "publicSellerLogoUrlSnapshot" TEXT,
    "publicSellerVerifiedSnapshot" BOOLEAN NOT NULL DEFAULT false,
    "sellerWhatsappSnapshot" TEXT,
    "privateDataPurgeAfter" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HuntOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuntSellerPreference" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "isOptedIn" BOOLEAN NOT NULL DEFAULT false,
    "cities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "consentedAt" TIMESTAMP(3),
    "consentSource" TEXT,
    "consentedBy" TEXT,
    "pausedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HuntSellerPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuntSellerRoute" (
    "id" TEXT NOT NULL,
    "huntId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "status" "HuntSellerRouteStatus" NOT NULL DEFAULT 'ROUTED',
    "routedBy" TEXT NOT NULL,
    "note" TEXT,
    "routedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HuntSellerRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuntEvent" (
    "id" TEXT NOT NULL,
    "huntId" TEXT,
    "offerId" TEXT,
    "type" "HuntEventType" NOT NULL,
    "actor" "HuntEventActor" NOT NULL,
    "visitorId" TEXT,
    "source" TEXT,
    "dedupeKey" TEXT,
    "purgeAfter" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HuntEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuntReport" (
    "id" TEXT NOT NULL,
    "huntId" TEXT NOT NULL,
    "reason" "HuntReportReason" NOT NULL,
    "details" TEXT,
    "status" "HuntReportStatus" NOT NULL DEFAULT 'OPEN',
    "reporterFeatureId" TEXT,
    "purgeAfter" TIMESTAMP(3) NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HuntReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuntTakedown" (
    "id" TEXT NOT NULL,
    "huntId" TEXT NOT NULL,
    "reportId" TEXT,
    "action" "HuntTakedownAction" NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HuntTakedown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuntMediaDeletionJob" (
    "id" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HuntMediaDeletionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuntRateLimitBucket" (
    "id" TEXT NOT NULL,
    "scope" "HuntRateLimitScope" NOT NULL,
    "keyHash" CHAR(64) NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HuntRateLimitBucket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_slug_key" ON "Shop"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_referralCode_key" ON "Shop"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_customDomain_key" ON "Shop"("customDomain");

-- CreateIndex
CREATE INDEX "Shop_slug_idx" ON "Shop"("slug");

-- CreateIndex
CREATE INDEX "Shop_isActive_idx" ON "Shop"("isActive");

-- CreateIndex
CREATE INDEX "Shop_isFeaturedShop_idx" ON "Shop"("isFeaturedShop");

-- CreateIndex
CREATE INDEX "Shop_referralCode_idx" ON "Shop"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMarketingPreference_userId_key" ON "EmailMarketingPreference"("userId");

-- CreateIndex
CREATE INDEX "EmailMarketingPreference_status_idx" ON "EmailMarketingPreference"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSuppression_providerEventId_key" ON "EmailSuppression"("providerEventId");

-- CreateIndex
CREATE INDEX "EmailSuppression_normalizedEmailHash_releasedAt_idx" ON "EmailSuppression"("normalizedEmailHash", "releasedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSuppression_normalizedEmailHash_reason_key" ON "EmailSuppression"("normalizedEmailHash", "reason");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMarketingCampaign_campaignKey_key" ON "EmailMarketingCampaign"("campaignKey");

-- CreateIndex
CREATE INDEX "EmailMarketingCampaign_status_createdAt_idx" ON "EmailMarketingCampaign"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmailMarketingCampaign_kind_createdAt_idx" ON "EmailMarketingCampaign"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "EmailMarketingCampaign_createdById_idx" ON "EmailMarketingCampaign"("createdById");

-- CreateIndex
CREATE INDEX "EmailMarketingCampaign_approvedById_idx" ON "EmailMarketingCampaign"("approvedById");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMarketingCampaignRecipient_idempotencyKey_key" ON "EmailMarketingCampaignRecipient"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMarketingCampaignRecipient_providerMessageId_key" ON "EmailMarketingCampaignRecipient"("providerMessageId");

-- CreateIndex
CREATE INDEX "EmailMarketingCampaignRecipient_campaignId_status_nextRetry_idx" ON "EmailMarketingCampaignRecipient"("campaignId", "status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "EmailMarketingCampaignRecipient_userId_createdAt_idx" ON "EmailMarketingCampaignRecipient"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailMarketingCampaignRecipient_shopId_idx" ON "EmailMarketingCampaignRecipient"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMarketingCampaignRecipient_campaignId_userId_key" ON "EmailMarketingCampaignRecipient"("campaignId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMarketingCampaignRecipient_campaignId_normalizedEmailH_key" ON "EmailMarketingCampaignRecipient"("campaignId", "normalizedEmailHash");

-- CreateIndex
CREATE INDEX "ShopUser_shopId_idx" ON "ShopUser"("shopId");

-- CreateIndex
CREATE INDEX "ShopUser_userId_idx" ON "ShopUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopUser_userId_shopId_key" ON "ShopUser"("userId", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffInvite_token_key" ON "StaffInvite"("token");

-- CreateIndex
CREATE INDEX "StaffInvite_token_idx" ON "StaffInvite"("token");

-- CreateIndex
CREATE INDEX "StaffInvite_email_idx" ON "StaffInvite"("email");

-- CreateIndex
CREATE INDEX "StaffInvite_shopId_idx" ON "StaffInvite"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffInvite_shopId_email_key" ON "StaffInvite"("shopId", "email");

-- CreateIndex
CREATE INDEX "Category_shopId_idx" ON "Category"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_shopId_slug_key" ON "Category"("shopId", "slug");

-- CreateIndex
CREATE INDEX "Product_shopId_idx" ON "Product"("shopId");

-- CreateIndex
CREATE INDEX "Product_shopId_isActive_idx" ON "Product"("shopId", "isActive");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_globalCategoryId_idx" ON "Product"("globalCategoryId");

-- CreateIndex
CREATE INDEX "Product_isActive_qualityScore_idx" ON "Product"("isActive", "qualityScore");

-- CreateIndex
CREATE INDEX "Product_name_trgm_idx" ON "Product" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopId_slug_key" ON "Product"("shopId", "slug");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE INDEX "ProductVideo_productId_idx" ON "ProductVideo"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_isActive_idx" ON "ProductVariant"("productId", "isActive");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_stock_idx" ON "ProductVariant"("productId", "stock");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_size_color_key" ON "ProductVariant"("productId", "size", "color");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_shopId_type_createdAt_idx" ON "AnalyticsEvent"("shopId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_shopId_productId_type_idx" ON "AnalyticsEvent"("shopId", "productId", "type");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_visitorId_idx" ON "AnalyticsEvent"("visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_shopId_key" ON "Subscription"("shopId");

-- CreateIndex
CREATE INDEX "Subscription_shopId_idx" ON "Subscription"("shopId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_upgradeStatus_idx" ON "Subscription"("upgradeStatus");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalCategory_slug_key" ON "GlobalCategory"("slug");

-- CreateIndex
CREATE INDEX "GlobalCategory_parentId_idx" ON "GlobalCategory"("parentId");

-- CreateIndex
CREATE INDEX "GlobalCategory_isActive_displayOrder_idx" ON "GlobalCategory"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "PromotedListing_status_expiresAt_idx" ON "PromotedListing"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "PromotedListing_shopId_idx" ON "PromotedListing"("shopId");

-- CreateIndex
CREATE INDEX "PromotedListing_productId_idx" ON "PromotedListing"("productId");

-- CreateIndex
CREATE INDEX "PromotedListing_tier_status_idx" ON "PromotedListing"("tier", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_shopId_status_idx" ON "Order"("shopId", "status");

-- CreateIndex
CREATE INDEX "Order_shopId_createdAt_idx" ON "Order"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_buyerClerkId_idx" ON "Order"("buyerClerkId");

-- CreateIndex
CREATE INDEX "Order_buyerPhone_idx" ON "Order"("buyerPhone");

-- CreateIndex
CREATE INDEX "Order_deletedAt_idx" ON "Order"("deletedAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderMessage_orderId_createdAt_idx" ON "OrderMessage"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderMessage_shopId_createdAt_idx" ON "OrderMessage"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderMessage_shopId_senderType_readAt_idx" ON "OrderMessage"("shopId", "senderType", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionFee_orderId_key" ON "TransactionFee"("orderId");

-- CreateIndex
CREATE INDEX "TransactionFee_shopId_createdAt_idx" ON "TransactionFee"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "TransactionFee_createdAt_idx" ON "TransactionFee"("createdAt");

-- CreateIndex
CREATE INDEX "PayfastNotification_processedAt_idx" ON "PayfastNotification"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PayfastNotification_pfPaymentId_paymentStatus_key" ON "PayfastNotification"("pfPaymentId", "paymentStatus");

-- CreateIndex
CREATE INDEX "WishlistItem_visitorId_idx" ON "WishlistItem"("visitorId");

-- CreateIndex
CREATE INDEX "WishlistItem_userId_idx" ON "WishlistItem"("userId");

-- CreateIndex
CREATE INDEX "WishlistItem_shopId_idx" ON "WishlistItem"("shopId");

-- CreateIndex
CREATE INDEX "WishlistItem_productId_notifyPhone_idx" ON "WishlistItem"("productId", "notifyPhone");

-- CreateIndex
CREATE INDEX "WishlistItem_productId_restockNotifiedAt_idx" ON "WishlistItem"("productId", "restockNotifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_productId_visitorId_key" ON "WishlistItem"("productId", "visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_productId_userId_key" ON "WishlistItem"("productId", "userId");

-- CreateIndex
CREATE INDEX "ShopGalleryItem_shopId_position_idx" ON "ShopGalleryItem"("shopId", "position");

-- CreateIndex
CREATE INDEX "Review_shopId_idx" ON "Review"("shopId");

-- CreateIndex
CREATE INDEX "Review_productId_isApproved_idx" ON "Review"("productId", "isApproved");

-- CreateIndex
CREATE INDEX "Review_shopId_isApproved_idx" ON "Review"("shopId", "isApproved");

-- CreateIndex
CREATE INDEX "Review_productId_rating_idx" ON "Review"("productId", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_shopId_key" ON "NotificationPreference"("shopId");

-- CreateIndex
CREATE INDEX "NotificationPreference_shopId_idx" ON "NotificationPreference"("shopId");

-- CreateIndex
CREATE INDEX "BulkImportJob_shopId_idx" ON "BulkImportJob"("shopId");

-- CreateIndex
CREATE INDEX "BulkImportJob_shopId_status_idx" ON "BulkImportJob"("shopId", "status");

-- CreateIndex
CREATE INDEX "ComboCategory_shopId_idx" ON "ComboCategory"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "ComboCategory_shopId_slug_key" ON "ComboCategory"("shopId", "slug");

-- CreateIndex
CREATE INDEX "Combo_shopId_idx" ON "Combo"("shopId");

-- CreateIndex
CREATE INDEX "Combo_shopId_isActive_idx" ON "Combo"("shopId", "isActive");

-- CreateIndex
CREATE INDEX "Combo_comboCategoryId_idx" ON "Combo"("comboCategoryId");

-- CreateIndex
CREATE INDEX "ComboItem_comboId_idx" ON "ComboItem"("comboId");

-- CreateIndex
CREATE INDEX "ComboImage_comboId_idx" ON "ComboImage"("comboId");

-- CreateIndex
CREATE INDEX "Drop_shopId_idx" ON "Drop"("shopId");

-- CreateIndex
CREATE INDEX "Drop_shopId_status_idx" ON "Drop"("shopId", "status");

-- CreateIndex
CREATE INDEX "Drop_shopId_isActive_idx" ON "Drop"("shopId", "isActive");

-- CreateIndex
CREATE INDEX "DropItem_dropId_idx" ON "DropItem"("dropId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_entityType_entityId_idx" ON "AdminAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SellerPreferences_shopId_key" ON "SellerPreferences"("shopId");

-- CreateIndex
CREATE INDEX "SellerPreferences_shopId_idx" ON "SellerPreferences"("shopId");

-- CreateIndex
CREATE INDEX "SellerMessage_shopId_idx" ON "SellerMessage"("shopId");

-- CreateIndex
CREATE INDEX "SellerMessage_messageType_idx" ON "SellerMessage"("messageType");

-- CreateIndex
CREATE INDEX "SellerMessage_sentAt_idx" ON "SellerMessage"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "SellerMessage_shopId_messageType_sentAt_key" ON "SellerMessage"("shopId", "messageType", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "SellerSequenceState_shopId_key" ON "SellerSequenceState"("shopId");

-- CreateIndex
CREATE INDEX "SellerSequenceState_shopId_idx" ON "SellerSequenceState"("shopId");

-- CreateIndex
CREATE INDEX "WhatsAppConversation_shopId_lastMessageAt_idx" ON "WhatsAppConversation"("shopId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppConversation_shopId_buyerPhone_key" ON "WhatsAppConversation"("shopId", "buyerPhone");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_conversationId_createdAt_idx" ON "WhatsAppMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WholesaleBuyer_phone_key" ON "WholesaleBuyer"("phone");

-- CreateIndex
CREATE INDEX "WholesaleBuyer_phone_idx" ON "WholesaleBuyer"("phone");

-- CreateIndex
CREATE INDEX "WholesaleBuyer_status_idx" ON "WholesaleBuyer"("status");

-- CreateIndex
CREATE INDEX "BulkDiscountTier_productId_idx" ON "BulkDiscountTier"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "BulkDiscountTier_productId_minQuantity_key" ON "BulkDiscountTier"("productId", "minQuantity");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralReward_referredShopId_key" ON "ReferralReward"("referredShopId");

-- CreateIndex
CREATE INDEX "ReferralReward_referrerShopId_idx" ON "ReferralReward"("referrerShopId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppProductImport_messageId_key" ON "WhatsAppProductImport"("messageId");

-- CreateIndex
CREATE INDEX "WhatsAppProductImport_shopId_createdAt_idx" ON "WhatsAppProductImport"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppProductImport_status_idx" ON "WhatsAppProductImport"("status");

-- CreateIndex
CREATE INDEX "RankingFactor_productId_computedAt_idx" ON "RankingFactor"("productId", "computedAt");

-- CreateIndex
CREATE INDEX "RankingFactor_shopId_computedAt_idx" ON "RankingFactor"("shopId", "computedAt");

-- CreateIndex
CREATE INDEX "RankingFactor_computedAt_idx" ON "RankingFactor"("computedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingEvent_dedupeKey_key" ON "OnboardingEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "OnboardingEvent_userId_step_idx" ON "OnboardingEvent"("userId", "step");

-- CreateIndex
CREATE INDEX "OnboardingEvent_createdAt_idx" ON "OnboardingEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_phoneNumber_createdAt_idx" ON "MagicLink"("phoneNumber", "createdAt");

-- CreateIndex
CREATE INDEX "MagicLink_token_idx" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "ImportJob_shopId_status_idx" ON "ImportJob"("shopId", "status");

-- CreateIndex
CREATE INDEX "ImportJob_shopId_createdAt_idx" ON "ImportJob"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "DraftListing_importJobId_status_idx" ON "DraftListing"("importJobId", "status");

-- CreateIndex
CREATE INDEX "DraftListing_shopId_idx" ON "DraftListing"("shopId");

-- CreateIndex
CREATE INDEX "ProductTranslation_productId_idx" ON "ProductTranslation"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_productId_locale_key" ON "ProductTranslation"("productId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "SellerVerification_shopId_key" ON "SellerVerification"("shopId");

-- CreateIndex
CREATE INDEX "SellerVerification_status_submittedAt_idx" ON "SellerVerification"("status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewRequest_orderId_key" ON "ReviewRequest"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewRequest_token_key" ON "ReviewRequest"("token");

-- CreateIndex
CREATE INDEX "ReviewRequest_shopId_idx" ON "ReviewRequest"("shopId");

-- CreateIndex
CREATE INDEX "ReviewRequest_token_idx" ON "ReviewRequest"("token");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerProfile_clerkId_key" ON "BuyerProfile"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerProfile_phone_key" ON "BuyerProfile"("phone");

-- CreateIndex
CREATE INDEX "BuyerProfile_clerkId_idx" ON "BuyerProfile"("clerkId");

-- CreateIndex
CREATE INDEX "BuyerProfile_phone_idx" ON "BuyerProfile"("phone");

-- CreateIndex
CREATE INDEX "BuyerAddress_buyerId_isDefault_idx" ON "BuyerAddress"("buyerId", "isDefault");

-- CreateIndex
CREATE INDEX "BuyerAddress_buyerId_updatedAt_idx" ON "BuyerAddress"("buyerId", "updatedAt");

-- CreateIndex
CREATE INDEX "BuyerNotification_buyerId_createdAt_idx" ON "BuyerNotification"("buyerId", "createdAt");

-- CreateIndex
CREATE INDEX "BuyerNotification_buyerId_readAt_idx" ON "BuyerNotification"("buyerId", "readAt");

-- CreateIndex
CREATE INDEX "ShopFollow_shopId_idx" ON "ShopFollow"("shopId");

-- CreateIndex
CREATE INDEX "ShopFollow_buyerId_createdAt_idx" ON "ShopFollow"("buyerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShopFollow_buyerId_shopId_key" ON "ShopFollow"("buyerId", "shopId");

-- CreateIndex
CREATE INDEX "ShopActivityLog_shopId_createdAt_idx" ON "ShopActivityLog"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopActivityLog_shopId_action_idx" ON "ShopActivityLog"("shopId", "action");

-- CreateIndex
CREATE INDEX "ShopActivityLog_shopId_userId_idx" ON "ShopActivityLog"("shopId", "userId");

-- CreateIndex
CREATE INDEX "ShopActivityLog_shopId_entityType_idx" ON "ShopActivityLog"("shopId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "Hunt_slug_key" ON "Hunt"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Hunt_selectedOfferId_key" ON "Hunt"("selectedOfferId");

-- CreateIndex
CREATE INDEX "Hunt_status_publishedAt_idx" ON "Hunt"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Hunt_status_expiresAt_idx" ON "Hunt"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Hunt_moderationStatus_status_createdAt_idx" ON "Hunt"("moderationStatus", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Hunt_city_status_createdAt_idx" ON "Hunt"("city", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Hunt_category_status_createdAt_idx" ON "Hunt"("category", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HuntPrivateData_huntId_key" ON "HuntPrivateData"("huntId");

-- CreateIndex
CREATE INDEX "HuntPrivateData_ownerFeatureId_createdAt_idx" ON "HuntPrivateData"("ownerFeatureId", "createdAt");

-- CreateIndex
CREATE INDEX "HuntPrivateData_whatsappNumber_createdAt_idx" ON "HuntPrivateData"("whatsappNumber", "createdAt");

-- CreateIndex
CREATE INDEX "HuntPrivateData_purgeAfter_idx" ON "HuntPrivateData"("purgeAfter");

-- CreateIndex
CREATE INDEX "HuntParticipant_visitorId_createdAt_idx" ON "HuntParticipant"("visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "HuntParticipant_huntId_createdAt_idx" ON "HuntParticipant"("huntId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HuntParticipant_huntId_visitorId_key" ON "HuntParticipant"("huntId", "visitorId");

-- CreateIndex
CREATE INDEX "HuntOffer_huntId_status_publishedAt_idx" ON "HuntOffer"("huntId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "HuntOffer_shopId_status_createdAt_idx" ON "HuntOffer"("shopId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "HuntOffer_status_publishedAt_idx" ON "HuntOffer"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "HuntOffer_privateDataPurgeAfter_idx" ON "HuntOffer"("privateDataPurgeAfter");

-- CreateIndex
CREATE UNIQUE INDEX "HuntOffer_huntId_shopId_key" ON "HuntOffer"("huntId", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "HuntSellerPreference_shopId_key" ON "HuntSellerPreference"("shopId");

-- CreateIndex
CREATE INDEX "HuntSellerPreference_isOptedIn_pausedAt_idx" ON "HuntSellerPreference"("isOptedIn", "pausedAt");

-- CreateIndex
CREATE INDEX "HuntSellerRoute_huntId_status_routedAt_idx" ON "HuntSellerRoute"("huntId", "status", "routedAt");

-- CreateIndex
CREATE INDEX "HuntSellerRoute_shopId_status_routedAt_idx" ON "HuntSellerRoute"("shopId", "status", "routedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HuntSellerRoute_huntId_shopId_key" ON "HuntSellerRoute"("huntId", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "HuntEvent_dedupeKey_key" ON "HuntEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "HuntEvent_huntId_type_createdAt_idx" ON "HuntEvent"("huntId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "HuntEvent_offerId_type_createdAt_idx" ON "HuntEvent"("offerId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "HuntEvent_type_createdAt_idx" ON "HuntEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "HuntEvent_visitorId_createdAt_idx" ON "HuntEvent"("visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "HuntEvent_purgeAfter_idx" ON "HuntEvent"("purgeAfter");

-- CreateIndex
CREATE INDEX "HuntReport_status_createdAt_idx" ON "HuntReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "HuntReport_huntId_status_createdAt_idx" ON "HuntReport"("huntId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "HuntReport_purgeAfter_idx" ON "HuntReport"("purgeAfter");

-- CreateIndex
CREATE UNIQUE INDEX "HuntReport_huntId_reporterFeatureId_key" ON "HuntReport"("huntId", "reporterFeatureId");

-- CreateIndex
CREATE INDEX "HuntTakedown_huntId_createdAt_idx" ON "HuntTakedown"("huntId", "createdAt");

-- CreateIndex
CREATE INDEX "HuntTakedown_reportId_createdAt_idx" ON "HuntTakedown"("reportId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HuntMediaDeletionJob_fileKey_key" ON "HuntMediaDeletionJob"("fileKey");

-- CreateIndex
CREATE INDEX "HuntMediaDeletionJob_nextAttemptAt_createdAt_idx" ON "HuntMediaDeletionJob"("nextAttemptAt", "createdAt");

-- CreateIndex
CREATE INDEX "HuntRateLimitBucket_windowEnd_idx" ON "HuntRateLimitBucket"("windowEnd");

-- CreateIndex
CREATE UNIQUE INDEX "HuntRateLimitBucket_scope_keyHash_windowStart_key" ON "HuntRateLimitBucket"("scope", "keyHash", "windowStart");

-- AddForeignKey
ALTER TABLE "EmailMarketingPreference" ADD CONSTRAINT "EmailMarketingPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMarketingCampaign" ADD CONSTRAINT "EmailMarketingCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMarketingCampaign" ADD CONSTRAINT "EmailMarketingCampaign_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMarketingCampaignRecipient" ADD CONSTRAINT "EmailMarketingCampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailMarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMarketingCampaignRecipient" ADD CONSTRAINT "EmailMarketingCampaignRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopUser" ADD CONSTRAINT "ShopUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopUser" ADD CONSTRAINT "ShopUser_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffInvite" ADD CONSTRAINT "StaffInvite_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_globalCategoryId_fkey" FOREIGN KEY ("globalCategoryId") REFERENCES "GlobalCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVideo" ADD CONSTRAINT "ProductVideo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalCategory" ADD CONSTRAINT "GlobalCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "GlobalCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotedListing" ADD CONSTRAINT "PromotedListing_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotedListing" ADD CONSTRAINT "PromotedListing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMessage" ADD CONSTRAINT "OrderMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMessage" ADD CONSTRAINT "OrderMessage_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionFee" ADD CONSTRAINT "TransactionFee_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionFee" ADD CONSTRAINT "TransactionFee_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopGalleryItem" ADD CONSTRAINT "ShopGalleryItem_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboCategory" ADD CONSTRAINT "ComboCategory_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Combo" ADD CONSTRAINT "Combo_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Combo" ADD CONSTRAINT "Combo_comboCategoryId_fkey" FOREIGN KEY ("comboCategoryId") REFERENCES "ComboCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboImage" ADD CONSTRAINT "ComboImage_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Combo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drop" ADD CONSTRAINT "Drop_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropItem" ADD CONSTRAINT "DropItem_dropId_fkey" FOREIGN KEY ("dropId") REFERENCES "Drop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerPreferences" ADD CONSTRAINT "SellerPreferences_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerMessage" ADD CONSTRAINT "SellerMessage_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerSequenceState" ADD CONSTRAINT "SellerSequenceState_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsAppConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkDiscountTier" ADD CONSTRAINT "BulkDiscountTier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referrerShopId_fkey" FOREIGN KEY ("referrerShopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referredShopId_fkey" FOREIGN KEY ("referredShopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppProductImport" ADD CONSTRAINT "WhatsAppProductImport_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingEvent" ADD CONSTRAINT "OnboardingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftListing" ADD CONSTRAINT "DraftListing_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerVerification" ADD CONSTRAINT "SellerVerification_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRequest" ADD CONSTRAINT "ReviewRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerAddress" ADD CONSTRAINT "BuyerAddress_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "BuyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerNotification" ADD CONSTRAINT "BuyerNotification_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "BuyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopFollow" ADD CONSTRAINT "ShopFollow_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "BuyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopFollow" ADD CONSTRAINT "ShopFollow_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopActivityLog" ADD CONSTRAINT "ShopActivityLog_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hunt" ADD CONSTRAINT "Hunt_selectedOfferId_fkey" FOREIGN KEY ("selectedOfferId") REFERENCES "HuntOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntPrivateData" ADD CONSTRAINT "HuntPrivateData_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "Hunt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntParticipant" ADD CONSTRAINT "HuntParticipant_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "Hunt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntOffer" ADD CONSTRAINT "HuntOffer_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "Hunt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntOffer" ADD CONSTRAINT "HuntOffer_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntSellerPreference" ADD CONSTRAINT "HuntSellerPreference_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntSellerRoute" ADD CONSTRAINT "HuntSellerRoute_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "Hunt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntSellerRoute" ADD CONSTRAINT "HuntSellerRoute_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntEvent" ADD CONSTRAINT "HuntEvent_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "Hunt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntEvent" ADD CONSTRAINT "HuntEvent_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "HuntOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntReport" ADD CONSTRAINT "HuntReport_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "Hunt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntTakedown" ADD CONSTRAINT "HuntTakedown_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "Hunt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntTakedown" ADD CONSTRAINT "HuntTakedown_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "HuntReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
