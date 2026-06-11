/**
 * Unit tests untuk validasi skema Drizzle
 *
 * Validates: Requirements 1.1, 4.4
 */

import { describe, it, expect } from "vitest";
import { insertWalletSchema } from "./wallets.js";
import { bookingStatusEnum } from "./bookings.js";

// ─── insertWalletSchema ───────────────────────────────────────────────────────

describe("insertWalletSchema", () => {
  describe("validasi userId", () => {
    it("menolak userId null", () => {
      const result = insertWalletSchema.safeParse({ userId: null });
      expect(result.success).toBe(false);
    });

    it("menolak userId undefined (tidak ada field userId)", () => {
      const result = insertWalletSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("menerima userId berupa integer positif", () => {
      const result = insertWalletSchema.safeParse({ userId: 1 });
      expect(result.success).toBe(true);
    });
  });

  describe("validasi balance", () => {
    it("menolak balance negatif", () => {
      const result = insertWalletSchema.safeParse({ userId: 1, balance: -1 });
      expect(result.success).toBe(false);
    });

    it("menolak balance negatif besar", () => {
      const result = insertWalletSchema.safeParse({ userId: 1, balance: -1000000 });
      expect(result.success).toBe(false);
    });

    it("menerima balance nol (saldo awal)", () => {
      const result = insertWalletSchema.safeParse({ userId: 1, balance: 0 });
      expect(result.success).toBe(true);
    });

    it("menerima balance positif", () => {
      const result = insertWalletSchema.safeParse({ userId: 1, balance: 500000 });
      expect(result.success).toBe(true);
    });
  });

  describe("validasi lockedBalance", () => {
    it("menolak lockedBalance negatif", () => {
      const result = insertWalletSchema.safeParse({ userId: 1, lockedBalance: -50 });
      expect(result.success).toBe(false);
    });

    it("menerima lockedBalance nol", () => {
      const result = insertWalletSchema.safeParse({ userId: 1, lockedBalance: 0 });
      expect(result.success).toBe(true);
    });
  });

  describe("input valid lengkap", () => {
    it("menerima data wallet valid dengan semua field", () => {
      const result = insertWalletSchema.safeParse({
        userId: 42,
        balance: 100000,
        lockedBalance: 0,
        version: 0,
        currency: "IDR",
      });
      expect(result.success).toBe(true);
    });

    it("menggunakan nilai default untuk field yang tidak diisi", () => {
      const result = insertWalletSchema.safeParse({ userId: 7 });
      expect(result.success).toBe(true);
      if (result.success) {
        // Field dengan default tidak harus ada di output jika tidak diisi
        expect(result.data.userId).toBe(7);
      }
    });
  });
});

// ─── bookingStatusEnum ───────────────────────────────────────────────────────

describe("bookingStatusEnum", () => {
  it("memiliki tepat 6 nilai status", () => {
    expect(bookingStatusEnum.enumValues).toHaveLength(6);
  });

  it("mengandung status 'pending'", () => {
    expect(bookingStatusEnum.enumValues).toContain("pending");
  });

  it("mengandung status 'pending_payment'", () => {
    expect(bookingStatusEnum.enumValues).toContain("pending_payment");
  });

  it("mengandung status 'paid'", () => {
    expect(bookingStatusEnum.enumValues).toContain("paid");
  });

  it("mengandung status 'confirmed'", () => {
    expect(bookingStatusEnum.enumValues).toContain("confirmed");
  });

  it("mengandung status 'completed'", () => {
    expect(bookingStatusEnum.enumValues).toContain("completed");
  });

  it("mengandung status 'cancelled'", () => {
    expect(bookingStatusEnum.enumValues).toContain("cancelled");
  });

  it("memiliki semua 6 nilai yang benar sekaligus", () => {
    const expectedValues = [
      "pending",
      "pending_payment",
      "paid",
      "confirmed",
      "completed",
      "cancelled",
    ] as const;

    expect(bookingStatusEnum.enumValues).toEqual(expectedValues);
  });
});
