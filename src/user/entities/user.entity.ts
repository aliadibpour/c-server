import { BaseEntity, Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Document } from "./document.entity";

@Entity('user')
export class User {
    @PrimaryGeneratedColumn({
        comment: "the quize uniqe id"
    })
    id: number;

    @Column()
    name: string;

    @Column()
    title: string;
    
    @Column()
    description: string;

    @CreateDateColumn()
    date: Date
}
