import { describe, expect, test } from "bun:test";
import {
  JOHN_DESK,
  OFFICE_HEIGHT,
  OFFICE_WIDTH,
  ROUTE,
  RUSHENDRA_DESK,
  WALLS,
} from "./index";
import {
  DomainError,
  etaSeconds,
  locationLabel,
  planApproval,
  planDispatch,
  planTick,
  progressPercent,
} from "../../../convex/model";

describe("frozen office route", () => {
  test("has 21 adjacent in-bounds points from Rushendra to John without walls", () => {
    expect(ROUTE).toHaveLength(21);
    expect(ROUTE[0]).toEqual(RUSHENDRA_DESK);
    expect(ROUTE.at(-1)).toEqual(JOHN_DESK);
    const wallKeys = new Set(WALLS.map(({ x, y }) => `${x},${y}`));
    ROUTE.forEach((point, index) => {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThan(OFFICE_WIDTH);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThan(OFFICE_HEIGHT);
      expect(wallKeys.has(`${point.x},${point.y}`)).toBeFalse();
      if (index > 0) {
        const previous = ROUTE[index - 1]!;
        expect(Math.abs(point.x - previous.x) + Math.abs(point.y - previous.y)).toBe(1);
      }
    });
  });
});

describe("dispatch guards", () => {
  test("replays the same request before evaluating busy or custody guards", () => {
    expect(
      planDispatch({
        existingRequest: true,
        courierBusy: true,
        itemExists: false,
        itemHeldByTarget: false,
      }),
    ).toBe("replay");
  });

  test("rejects a busy courier and wrong custody", () => {
    expect(() =>
      planDispatch({
        existingRequest: false,
        courierBusy: true,
        itemExists: true,
        itemHeldByTarget: true,
      }),
    ).toThrow(new DomainError("COURIER_BUSY", "RUNNER-01 is already on a mission."));
    expect(() =>
      planDispatch({
        existingRequest: false,
        courierBusy: false,
        itemExists: true,
        itemHeldByTarget: false,
      }),
    ).toThrow("John does not currently hold");
  });
});

describe("movement planning", () => {
  test("increments outbound once and stale ticks are no-ops", () => {
    expect(
      planTick({
        status: "outbound",
        direction: "outbound",
        routeIndex: 0,
        version: 3,
        expectedVersion: 3,
        pathLength: ROUTE.length,
      }),
    ).toMatchObject({ kind: "move", nextRouteIndex: 1, nextVersion: 4 });
    expect(
      planTick({
        status: "outbound",
        direction: "outbound",
        routeIndex: 0,
        version: 3,
        expectedVersion: 2,
        pathLength: ROUTE.length,
      }),
    ).toEqual({ kind: "noop" });
  });

  test("arrives once at approval and terminal states cannot move", () => {
    expect(
      planTick({
        status: "outbound",
        direction: "outbound",
        routeIndex: 19,
        version: 19,
        expectedVersion: 19,
        pathLength: ROUTE.length,
      }),
    ).toMatchObject({
      kind: "move",
      nextRouteIndex: 20,
      nextStatus: "awaiting_approval",
      nextDirection: null,
      arrived: "target",
    });
    for (const status of ["delivered", "denied", "failed"] as const) {
      expect(
        planTick({
          status,
          direction: null,
          routeIndex: 0,
          version: 50,
          expectedVersion: 50,
          pathLength: ROUTE.length,
        }),
      ).toEqual({ kind: "noop" });
    }
  });

  test("returns with or without the item to the correct terminal state", () => {
    expect(
      planTick({
        status: "returning_with_item",
        direction: "returning",
        routeIndex: 1,
        version: 40,
        expectedVersion: 40,
        pathLength: ROUTE.length,
      }),
    ).toMatchObject({ nextRouteIndex: 0, nextStatus: "delivered", arrived: "requester" });
    expect(
      planTick({
        status: "returning_empty",
        direction: "returning",
        routeIndex: 1,
        version: 40,
        expectedVersion: 40,
        pathLength: ROUTE.length,
      }),
    ).toMatchObject({ nextRouteIndex: 0, nextStatus: "denied", arrived: "requester" });
  });
});

describe("approval guards", () => {
  test("approval transfers once, same decision replays, and contradiction fails", () => {
    expect(
      planApproval({
        missionStatus: "awaiting_approval",
        approvalStatus: "pending",
        decision: "approved",
      }),
    ).toEqual({
      kind: "commit",
      missionStatus: "returning_with_item",
      transferToCourier: true,
    });
    expect(
      planApproval({
        missionStatus: "returning_with_item",
        approvalStatus: "approved",
        decision: "approved",
      }),
    ).toEqual({ kind: "replay" });
    expect(() =>
      planApproval({
        missionStatus: "returning_with_item",
        approvalStatus: "approved",
        decision: "denied",
      }),
    ).toThrow("different decision");
  });

  test("denial keeps custody at John and starts an empty return", () => {
    expect(
      planApproval({
        missionStatus: "awaiting_approval",
        approvalStatus: "pending",
        decision: "denied",
      }),
    ).toEqual({
      kind: "commit",
      missionStatus: "returning_empty",
      transferToCourier: false,
    });
  });
});

describe("snapshot projection math", () => {
  test("uses the frozen 0-50-100 progress scale", () => {
    expect(progressPercent("outbound", 0, ROUTE.length)).toBe(0);
    expect(progressPercent("outbound", 10, ROUTE.length)).toBe(25);
    expect(progressPercent("awaiting_approval", 20, ROUTE.length)).toBe(50);
    expect(progressPercent("returning_with_item", 10, ROUTE.length)).toBe(75);
    expect(progressPercent("delivered", 0, ROUTE.length)).toBe(100);
  });

  test("reports honest ETA and location labels", () => {
    expect(etaSeconds("outbound", 0, ROUTE.length)).toBe(9);
    expect(etaSeconds("awaiting_approval", 20, ROUTE.length)).toBeNull();
    expect(etaSeconds("returning_empty", 10, ROUTE.length)).toBe(5);
    expect(locationLabel("awaiting_approval", 20, ROUTE.length)).toBe("At John's desk");
    expect(locationLabel("returning_with_item", 10, ROUTE.length)).toBe(
      "Returning to Rushendra",
    );
    expect(locationLabel("delivered", 0, ROUTE.length)).toBe("At Rushendra's desk");
  });
});
