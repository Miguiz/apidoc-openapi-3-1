declare module 'generate-schema' {
    export function json(title: string, data: object): object;
    export function mongoose(title: string, data: object): object;
    export function mysql(title: string, data: object): object;
    export function mssql(title: string, data: object): object;
    export function postgres(title: string, data: object): object;
    export function sqlite(title: string, data: object): object;
    export function bigquery(title: string, data: object): object;
}
