import type { EmployeeRequestFormRepository } from "@/domain/repositories/EmployeeRequestFormRepository"

export class GetEmployeeRequestForms {
  constructor(private readonly repo: EmployeeRequestFormRepository) {}

  async execute() {
    return this.repo.getAll()
  }
}
