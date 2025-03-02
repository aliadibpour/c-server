export class CreateTodoDto {
    title: string;
    description: string;
    status: string;
}

export class ChangeStatusDto {
    id: string;
    status: string;
}