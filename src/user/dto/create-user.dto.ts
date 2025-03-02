import { IsEmpty, IsNotEmpty } from "class-validator";

export class CreateUserDto {
    @IsEmpty({message: "name is empty"})
    name: string;
    
    @IsEmpty({message: "name is empty"})
    age: number;
}
