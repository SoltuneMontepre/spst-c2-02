-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'EMAIL');

-- CreateEnum
CREATE TYPE "VerificationTokenType" AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('CREATED', 'LOBBY', 'INTRO', 'ROUND_1', 'ROUND_2', 'ROUND_3', 'ROUND_4', 'DEBRIEF', 'COMPLETED', 'INCOMPLETE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoundPhase" AS ENUM ('EVENT', 'DECISION', 'MARKET_OPEN', 'SETTLEMENT', 'RECAP');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PRODUCER', 'CONSUMER', 'INTERMEDIARY', 'GOVERNMENT');

-- CreateEnum
CREATE TYPE "ControlMode" AS ENUM ('HUMAN', 'BOT_TAKEOVER', 'BOT_PERMANENT', 'READ_ONLY_DUPLICATE_TAB');

-- CreateEnum
CREATE TYPE "Presence" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "ProductivityProfile" AS ENUM ('TRADITIONAL', 'SOCIAL_AVERAGE', 'PIONEER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('BASELINE', 'BUMPER_HARVEST', 'VIRAL', 'TECH_DIFFUSION');

-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('PARTICIPANT');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('INITIAL_CAPITAL', 'PRODUCTION_COST', 'UPGRADE_COST', 'SALE_REVENUE', 'PURCHASE_COST', 'WHOLESALE_REVENUE', 'WHOLESALE_COST', 'SUBSIDY', 'POLICY_COST', 'EXPORT_REVENUE');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('AVAILABLE', 'RESERVED_LISTING', 'RESERVED_WHOLESALE', 'AT_RISK', 'SPOILED', 'CARRIED', 'SOLD');

-- CreateEnum
CREATE TYPE "ProtectionState" AS ENUM ('NONE', 'PROTECTED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CLOSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SellerType" AS ENUM ('PRODUCER', 'INTERMEDIARY');

-- CreateEnum
CREATE TYPE "BuyerType" AS ENUM ('CONSUMER', 'INTERMEDIARY', 'SYSTEM_EXPORT');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('OPEN', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WholesaleStatus" AS ENUM ('OPEN', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionChannel" AS ENUM ('RETAIL_DIRECT', 'RETAIL_INTERMEDIARY', 'WHOLESALE', 'SYSTEM_EXPORT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('INFO_DISCLOSURE', 'COLD_STORAGE', 'EXPORT_PROMOTION', 'TECH_SUPPORT', 'NONE');

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('PENDING', 'APPLIED', 'FAILED');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('EFFICIENT_PRODUCER', 'WISE_CONSUMER', 'MARKET_CONNECTOR', 'BALANCED_REGULATOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerSubject" TEXT NOT NULL,
    "passwordHash" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "VerificationTokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'CREATED',
    "scenarioVersion" TEXT NOT NULL DEFAULT 'dragon-fruit-v1',
    "maxPlayers" INTEGER NOT NULL DEFAULT 10,
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "phase" "RoundPhase",
    "phaseEndsAt" TIMESTAMP(3),
    "phaseExtensions" INTEGER NOT NULL DEFAULT 0,
    "stateVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "displayNameSnapshot" TEXT NOT NULL,
    "avatarSnapshot" TEXT,
    "role" "Role",
    "productivityProfile" "ProductivityProfile",
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "controlMode" "ControlMode" NOT NULL DEFAULT 'HUMAN',
    "presence" "Presence" NOT NULL DEFAULT 'OFFLINE',
    "ready" BOOLEAN NOT NULL DEFAULT false,
    "tutorialCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioConfig" (
    "version" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioConfig_pkey" PRIMARY KEY ("version")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "eventType" "EventType" NOT NULL,
    "socialLaborTime" INTEGER NOT NULL,
    "unitValueVnd" INTEGER NOT NULL,
    "phase" "RoundPhase" NOT NULL DEFAULT 'EVENT',
    "startedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleState" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "state" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "ownerType" "OwnerType" NOT NULL DEFAULT 'PARTICIPANT',
    "participantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "balanceVnd" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "roundId" TEXT,
    "walletId" TEXT NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "amountVnd" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLot" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "roundIdProduced" TEXT NOT NULL,
    "ownerParticipantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'AVAILABLE',
    "unitCostVnd" INTEGER NOT NULL,
    "protectionState" "ProtectionState" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "sellerParticipantId" TEXT NOT NULL,
    "sellerType" "SellerType" NOT NULL,
    "inventoryLotId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "askPriceVnd" INTEGER NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "fromParticipantId" TEXT NOT NULL,
    "toParticipantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "offerPriceVnd" INTEGER NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'OPEN',
    "parentOfferId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesaleOffer" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,
    "intermediaryId" TEXT,
    "inventoryLotId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "minimumPriceVnd" INTEGER NOT NULL,
    "counterPriceVnd" INTEGER,
    "status" "WholesaleStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WholesaleOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "channel" "TransactionChannel" NOT NULL,
    "buyerType" "BuyerType" NOT NULL,
    "buyerId" TEXT,
    "sellerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceVnd" INTEGER NOT NULL,
    "totalPriceVnd" INTEGER NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "clientActionId" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyAction" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "stateParticipantId" TEXT NOT NULL,
    "policyType" "PolicyType" NOT NULL,
    "targetIds" TEXT[],
    "fixedCostVnd" INTEGER NOT NULL DEFAULT 0,
    "variableCostVnd" INTEGER NOT NULL DEFAULT 0,
    "status" "PolicyStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSnapshot" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "stateVersion" INTEGER NOT NULL,
    "supplyQuantity" INTEGER NOT NULL DEFAULT 0,
    "demandQuantity" INTEGER NOT NULL DEFAULT 0,
    "retailSoldQuantity" INTEGER NOT NULL DEFAULT 0,
    "wholesaleQuantity" INTEGER NOT NULL DEFAULT 0,
    "spoiledQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitValueVnd" INTEGER NOT NULL,
    "marketPriceNumeratorVndUnits" INTEGER NOT NULL DEFAULT 0,
    "marketPriceDenominatorUnits" INTEGER NOT NULL DEFAULT 0,
    "marketPriceVnd" INTEGER,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionResult" (
    "sessionId" TEXT NOT NULL,
    "scenarioVersion" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL,
    "roundSnapshotIds" TEXT[],
    "participantOutcomes" JSONB NOT NULL,
    "badges" JSONB NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionResult_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "type" "BadgeType" NOT NULL,
    "metrics" JSONB NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "clientActionId" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AuthIdentity_userId_idx" ON "AuthIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthIdentity_provider_providerSubject_key" ON "AuthIdentity"("provider", "providerSubject");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_tokenHash_key" ON "VerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "VerificationToken_userId_idx" ON "VerificationToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_code_key" ON "GameSession"("code");

-- CreateIndex
CREATE INDEX "GameSession_hostUserId_idx" ON "GameSession"("hostUserId");

-- CreateIndex
CREATE INDEX "GameSession_status_idx" ON "GameSession"("status");

-- CreateIndex
CREATE INDEX "Participant_sessionId_idx" ON "Participant"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_sessionId_userId_key" ON "Participant"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "Round_sessionId_idx" ON "Round"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Round_sessionId_number_key" ON "Round"("sessionId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "RoleState_participantId_roundId_key" ON "RoleState"("participantId", "roundId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_participantId_key" ON "Wallet"("participantId");

-- CreateIndex
CREATE INDEX "Wallet_sessionId_idx" ON "Wallet"("sessionId");

-- CreateIndex
CREATE INDEX "LedgerEntry_walletId_idx" ON "LedgerEntry"("walletId");

-- CreateIndex
CREATE INDEX "LedgerEntry_sessionId_idx" ON "LedgerEntry"("sessionId");

-- CreateIndex
CREATE INDEX "InventoryLot_sessionId_idx" ON "InventoryLot"("sessionId");

-- CreateIndex
CREATE INDEX "InventoryLot_ownerParticipantId_idx" ON "InventoryLot"("ownerParticipantId");

-- CreateIndex
CREATE INDEX "Listing_roundId_idx" ON "Listing"("roundId");

-- CreateIndex
CREATE INDEX "Offer_listingId_idx" ON "Offer"("listingId");

-- CreateIndex
CREATE INDEX "WholesaleOffer_roundId_idx" ON "WholesaleOffer"("roundId");

-- CreateIndex
CREATE INDEX "Transaction_sessionId_idx" ON "Transaction"("sessionId");

-- CreateIndex
CREATE INDEX "Transaction_roundId_idx" ON "Transaction"("roundId");

-- CreateIndex
CREATE INDEX "PolicyAction_roundId_idx" ON "PolicyAction"("roundId");

-- CreateIndex
CREATE INDEX "MarketSnapshot_roundId_idx" ON "MarketSnapshot"("roundId");

-- CreateIndex
CREATE INDEX "Badge_sessionId_idx" ON "Badge"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_participantId_clientActionId_key" ON "IdempotencyRecord"("participantId", "clientActionId");

-- AddForeignKey
ALTER TABLE "AuthIdentity" ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleState" ADD CONSTRAINT "RoleState_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleState" ADD CONSTRAINT "RoleState_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_ownerParticipantId_fkey" FOREIGN KEY ("ownerParticipantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_inventoryLotId_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "InventoryLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_parentOfferId_fkey" FOREIGN KEY ("parentOfferId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleOffer" ADD CONSTRAINT "WholesaleOffer_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WholesaleOffer" ADD CONSTRAINT "WholesaleOffer_inventoryLotId_fkey" FOREIGN KEY ("inventoryLotId") REFERENCES "InventoryLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyAction" ADD CONSTRAINT "PolicyAction_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketSnapshot" ADD CONSTRAINT "MarketSnapshot_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionResult" ADD CONSTRAINT "SessionResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
