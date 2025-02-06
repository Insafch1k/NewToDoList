export class Task {
    id!: number;
    title!: string;
    detail?: string;
    creation_date!: string;
    execution_date!: string;
    execution_mark!: string;
    executors!: string[]; // Массив строк (ID исполнителей в виде строк)
    isDropdownOpen?: boolean;
  }
export class Users {
    id!: number;
    username!: string; // Уберите знак "?" для обязательного свойства
    selectedForNewTask?: boolean;
    selectedForEditTask?: boolean;
    selectedForFilter?: boolean;
}

export class CreateTask {
    title!: string;
    detail?: string;
    creation_date!: string;
    execution_date!: string;
    execution_mark!: string;
    executors!: number[];
}

export class UserCreate {
    username?: string;
}

export class UserResponse {
    id?: number;
    username?: string;
}

export class UpdateStatus {
    status?: string;
}

export class getUserId {
  id?: number;
  username?: string;
}

export class SearchQuery {
    query!: string;
}

export class UpdateTaskUsers {
    executors!: number[];
}
