import { Column, CreateDateColumn, Entity, JoinTable, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Document {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string;

    @Column()
    desciption: string;

    @CreateDateColumn()
    date: Date

    @OneToOne(() => User, User => User.name)
    @JoinTable()
    user: User
}