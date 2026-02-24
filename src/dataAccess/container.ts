// Dependency injection container simple
// Aquí centralizamos la creación de repositorios para facilitar el cambio a backend en el futuro

import { PlaybookRepository, PlayRepository, FormationRepository } from "./repositories";
import {
  LocalStoragePlaybookRepository,
  LocalStoragePlayRepository,
  LocalStorageFormationRepository,
} from "./localStorageRepositories";

class Container {
  private static _playbookRepo: PlaybookRepository | null = null;
  private static _playRepo: PlayRepository | null = null;
  private static _formationRepo: FormationRepository | null = null;

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

  // Para testing o cambio de implementación
  static reset() {
    this._playbookRepo = null;
    this._playRepo = null;
    this._formationRepo = null;
  }
}

export default Container;
