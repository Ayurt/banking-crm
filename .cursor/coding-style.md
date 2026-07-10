# Coding Style

## TypeScript

- `strict: true`, no `any`, no `@ts-ignore`
- Prefer `async/await` over raw promises
- Use interfaces for repository contracts (`ICustomerRepository`)

## NestJS

- One module per feature: `controller`, `service`, `repository`, `dto`, `module`
- DI for all services, repositories, tools
- Global exception filter for errors
- DTOs with `class-validator` + `@ApiProperty`

## Naming

| Type | Example |
|------|---------|
| Controller | `CustomerController` |
| Service | `CustomerService` |
| Repository | `CustomerRepository` |
| Tool | `CustomerTool` |
| DTO | `CreateCustomerDto` |

## API Responses

```typescript
// Success
{ success: true, message: '...', data: {}, meta: {} }

// Error
{ success: false, message: '...', errorCode: 'CUSTOMER_NOT_FOUND' }
```

## Imports

Use path aliases in backend: `@modules/*`, `@agents/*`, `@tools/*`, `@common/*`

Avoid deep relative paths (`../../../`).
