export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = new.target.name
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404)
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly issues: string[] = [],
  ) {
    super(message, 400)
  }
}

export class AiGenerationError extends AppError {
  constructor(message = "AI could not generate a Blueprint update") {
    super(message, 502)
  }
}
