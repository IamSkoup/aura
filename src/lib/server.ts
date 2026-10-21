import { NextResponse } from 'next/server';
export function fail(error:unknown,status=400){const message=error instanceof Error ? error.message : 'Неизвестная ошибка';console.error('API error:',message);return NextResponse.json({error:message},{status: message.includes('Требуется вход') ? 401 : message.includes('Доступ только') ? 403 : status});}
export function json(data:unknown,status=200){return NextResponse.json(data,{status});}
