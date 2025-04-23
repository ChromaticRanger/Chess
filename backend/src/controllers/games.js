import { prisma } from "../index.js";

// Create a new game
export const createGame = async (c) => {
  try {
    const user = c.get("user");
    const {
      name,
      description,
      date,
      venue,
      event,
      round,
      whitePlayer,
      whiteRating,
      blackPlayer,
      blackRating,
      result,
      moveHistory,
      pgn, // <-- Add pgn here
    } = await c.req.json();

    // Check if required fields are present
    if (!name || !moveHistory) {
      return c.json({ error: "Name and move history are required" }, 400);
    }

    // Parse date if it's a string
    let parsedDate = null;
    if (date) {
      try {
        parsedDate = new Date(date);
      } catch (e) {
        console.error("Date parsing error:", e);
      }
    }

    // Create complete game record
    const game = await prisma.game.create({
      data: {
        name,
        description: description || "",
        date: parsedDate,
        venue: venue || null,
        event: event || null,
        round: round || null,
        whitePlayer: whitePlayer || null,
        whiteRating: whiteRating ? parseInt(whiteRating) : null,
        blackPlayer: blackPlayer || null,
        blackRating: blackRating ? parseInt(blackRating) : null,
        result: result || null,
        moveHistory,
        pgn: pgn || null, // <-- Add pgn here
        userId: user.id,
      },
    });

    return c.json({ game });
  } catch (error) {
    console.error("Create game error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

// Get all games for the current user with filtering
export const getUserGames = async (c) => {
  try {
    const user = c.get("user");

    // Extract query parameters for filtering
    const url = new URL(c.req.url);
    const params = url.searchParams;

    // Build filter conditions
    const whereCondition = {
      userId: user.id,
    };

    // Apply filters if they exist
    if (params.has("whitePlayer")) {
      whereCondition.whitePlayer = {
        contains: params.get("whitePlayer"),
        mode: "insensitive",
      };
    }

    if (params.has("blackPlayer")) {
      whereCondition.blackPlayer = {
        contains: params.get("blackPlayer"),
        mode: "insensitive",
      };
    }

    if (params.has("event")) {
      whereCondition.event = {
        contains: params.get("event"),
        mode: "insensitive",
      };
    }

    if (params.has("venue")) {
      whereCondition.venue = {
        contains: params.get("venue"),
        mode: "insensitive",
      };
    }

    // Date range filtering
    if (params.has("dateFrom")) {
      const dateFrom = new Date(params.get("dateFrom"));
      if (!isNaN(dateFrom.getTime())) {
        whereCondition.date = {
          ...whereCondition.date,
          gte: dateFrom,
        };
      }
    }

    if (params.has("dateTo")) {
      const dateTo = new Date(params.get("dateTo"));
      if (!isNaN(dateTo.getTime())) {
        whereCondition.date = {
          ...whereCondition.date,
          lte: dateTo,
        };
      }
    }

    // Set up ordering
    const orderBy = {};
    const sortField = params.get("sortBy") || "updatedAt";
    const sortDirection = params.get("sortDir") || "desc";

    // Validate sort field
    const validSortFields = [
      "name",
      "date",
      "venue",
      "event",
      "whitePlayer",
      "blackPlayer",
      "createdAt",
      "updatedAt",
    ];

    if (validSortFields.includes(sortField)) {
      orderBy[sortField] = sortDirection === "asc" ? "asc" : "desc";
    } else {
      orderBy.updatedAt = "desc"; // Default sorting
    }

    // Pagination
    const page = parseInt(params.get("page")) || 1;
    const pageSize = parseInt(params.get("pageSize")) || 10;
    const skip = (page - 1) * pageSize;

    // Execute query with filters and pagination
    const [games, totalCount] = await Promise.all([
      prisma.game.findMany({
        where: whereCondition,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.game.count({
        where: whereCondition,
      }),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize);

    return c.json({
      games,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get user games error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

// Get a specific game by ID
export const getGameById = async (c) => {
  try {
    const user = c.get("user");
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ error: "Invalid game ID" }, 400);
    }

    const game = await prisma.game.findUnique({
      where: { id },
    });

    if (!game) {
      return c.json({ error: "Game not found" }, 404);
    }

    if (game.userId !== user.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    return c.json({ game });
  } catch (error) {
    console.error("Get game by ID error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

// Update a game
export const updateGame = async (c) => {
  try {
    const user = c.get("user");
    const id = parseInt(c.req.param("id"));
    const {
      name,
      description,
      date,
      venue,
      event,
      round,
      whitePlayer,
      whiteRating,
      blackPlayer,
      blackRating,
      result,
      moveHistory,
      pgn, // <-- Add pgn here
    } = await c.req.json();

    if (isNaN(id)) {
      return c.json({ error: "Invalid game ID" }, 400);
    }

    // Check if game exists and belongs to user
    const existingGame = await prisma.game.findUnique({
      where: { id },
    });

    if (!existingGame) {
      return c.json({ error: "Game not found" }, 404);
    }

    if (existingGame.userId !== user.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    // Parse date if it's a string
    let parsedDate = undefined;
    if (date !== undefined) {
      if (date === null) {
        parsedDate = null;
      } else {
        try {
          parsedDate = new Date(date);
          if (isNaN(parsedDate.getTime())) {
            parsedDate = existingGame.date;
          }
        } catch (e) {
          console.error("Date parsing error:", e);
          parsedDate = existingGame.date;
        }
      }
    }

    // Prepare update data
    const updateData = {
      name: name !== undefined ? name : existingGame.name,
      description:
        description !== undefined ? description : existingGame.description,
      date: parsedDate,
      venue: venue !== undefined ? venue : existingGame.venue,
      event: event !== undefined ? event : existingGame.event,
      round: round !== undefined ? round : existingGame.round,
      whitePlayer:
        whitePlayer !== undefined ? whitePlayer : existingGame.whitePlayer,
      blackPlayer:
        blackPlayer !== undefined ? blackPlayer : existingGame.blackPlayer,
      result: result !== undefined ? result : existingGame.result,
      moveHistory:
        moveHistory !== undefined ? moveHistory : existingGame.moveHistory,
      pgn: pgn !== undefined ? pgn : existingGame.pgn, // <-- Add pgn here
    };

    // Handle numeric fields separately to ensure they're properly coerced
    if (whiteRating !== undefined) {
      updateData.whiteRating =
        whiteRating !== null ? parseInt(whiteRating) : null;
    }

    if (blackRating !== undefined) {
      updateData.blackRating =
        blackRating !== null ? parseInt(blackRating) : null;
    }

    // Update game
    const game = await prisma.game.update({
      where: { id },
      data: updateData,
    });

    return c.json({ game });
  } catch (error) {
    console.error("Update game error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

// Delete a game
export const deleteGame = async (c) => {
  try {
    const user = c.get("user");
    const id = parseInt(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ error: "Invalid game ID" }, 400);
    }

    // Check if game exists and belongs to user
    const existingGame = await prisma.game.findUnique({
      where: { id },
    });

    if (!existingGame) {
      return c.json({ error: "Game not found" }, 404);
    }

    if (existingGame.userId !== user.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    // Delete game
    await prisma.game.delete({
      where: { id },
    });

    return c.json({ message: "Game deleted successfully" });
  } catch (error) {
    console.error("Delete game error:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};
