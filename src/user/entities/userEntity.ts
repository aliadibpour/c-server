import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity("users")
export class UserEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({unique: true})
    phoneNumber: string
}