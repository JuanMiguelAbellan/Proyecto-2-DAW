import IaReposiroty from "../domain/ia.repository";
import IaRepositoryPostgres from "../infrastructure/db/ia.repository.Postgres";


export default class IaUseCases{

    constructor(private iaRepository: IaRepositoryPostgres){}

    addPreferencia(preferencia: String, id:Number): Promise<String> {
        return this.addPreferencia(preferencia, id)
    }
    editPreferencia(preferencais: String, id:Number): Promise<String> {
        return this.editPreferencia(preferencais, id)
    }
}