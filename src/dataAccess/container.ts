// Dependency injection container simple
// Aquí centralizamos la creación de repositorios para facilitar el cambio a backend en el futuro

import { PlaybookRepository, PlayRepository, FormationRepository, PlayerTemplateRepository } from "./repositories";
import {
  LocalStoragePlaybookRepository,
  LocalStoragePlayRepository,
  LocalStorageFormationRepository,
  LocalStoragePlayerTemplateRepository,
} from "./localStorageRepositories";

class Container {
  private static _playbookRepo: PlaybookRepository | null = null;
  private static _playRepo: PlayRepository | null = null;
  private static _formationRepo: FormationRepository | null = null;
  private static _playerTemplateRepo: PlayerTemplateRepository | null = null;

  static getPlaybookRepository(): PlaybookRepository {
    if (!this._playbookRepo) {
      this._playbookRepo = new LocalStoragePlaybookRepository();
    }
    return this._playbookRepo;
  }

  static getPlayRepository(): PlayRepository {
    if (!this._playRepo) {
      this._playRepo = new LocalStoragePlayRepository(this.getPlaybookRepository());
    }
    return this._playRepo;
  }

  static getFormationRepository(): FormationRepository {
    if (!this._formationRepo) {
      this._formationRepo = new LocalStorageFormationRepository();
    }
    return this._formationRepo;
  }

  static getPlayerTemplateRepository(): PlayerTemplateRepository {
    if (!this._playerTemplateRepo) {
      this._playerTemplateRepo = new LocalStoragePlayerTemplateRepository();
    }
    return this._playerTemplateRepo;
  }

  // Para testing o cambio de implementación
  static reset() {
    this._playbookRepo = null;
    this._playRepo = null;
    this._formationRepo = null;
    this._playerTemplateRepo = null;
  }
}

export default Container;
