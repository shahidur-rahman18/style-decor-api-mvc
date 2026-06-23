jest.mock("../../src/models/DecoratorRequest.model");

const DecoratorRequest = require("../../src/models/DecoratorRequest.model");
const decoratorService = require("../../src/services/decorator.service");

describe("decorator.service", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns null when email already requested", async () => {
    DecoratorRequest.findOne.mockResolvedValue({ email: "a@b.com" });

    const result = await decoratorService.createRequest("a@b.com");

    expect(result).toBeNull();
  });

  test("creates a new decorator request", async () => {
    DecoratorRequest.findOne.mockResolvedValue(null);
    DecoratorRequest.create.mockResolvedValue({ _id: "req123" });

    const result = await decoratorService.createRequest("a@b.com");

    expect(result).toEqual({ acknowledged: true, insertedId: "req123" });
    expect(DecoratorRequest.create).toHaveBeenCalledWith({ email: "a@b.com" });
  });
});
