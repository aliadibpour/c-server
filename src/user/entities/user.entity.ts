import { BaseEntity, Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('user')
export class User {
    @PrimaryGeneratedColumn({
        comment: "the quize uniqe id"
    })
    id: number;

    @Column()
    name: string;

    @Column()
    phoneNumber: number;

    @Column({nullable: true})
    telegram: number;

    @CreateDateColumn()
    date: Date
}
