import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { FavoriteTeam } from './favorite-team';

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => FavoriteTeam, (favoriteTeam) => favoriteTeam.team)
  favoriteTeams: FavoriteTeam[];
}
