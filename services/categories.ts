/**
 * @packageDocumentation
 * Serviço de categorias de produtos para Merchant Web.
 * Gerencia categorias com população automática se não existirem.
 */

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    Timestamp,
    updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export type Category = {
    id: string;
    name: string;
    icon?: string; // Nome do ícone do Material Community Icons
    createdAt?: Timestamp;
};

const DEFAULT_CATEGORIES = [
    { name: 'Comidas', icon: 'food' },
    { name: 'Bebidas', icon: 'cup' }
];

/**
 * Popula categorias padrão no Firestore se não existirem.
 */
async function ensureDefaultCategories(): Promise<void> {
    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);

    // Se já existem categorias, não faz nada
    if (!snapshot.empty) {
        return;
    }

    // Popula categorias padrão
    for (const category of DEFAULT_CATEGORIES) {
        await addDoc(categoriesRef, {
            name: category.name,
            icon: category.icon,
            createdAt: Timestamp.now(),
        });
    }
}

/**
 * Busca todas as categorias do Firestore.
 * Se não houver categorias, popula automaticamente com as padrão.
 */
export async function getCategories(): Promise<Category[]> {
    try {
        await ensureDefaultCategories();

        const categoriesRef = collection(db, 'categories');
        const q = query(categoriesRef, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);

        const categories: Category[] = [];
        snapshot.forEach((doc) => {
            categories.push({
                id: doc.id,
                name: doc.data().name,
                icon: doc.data().icon,
                createdAt: doc.data().createdAt,
            });
        });

        return categories;
    } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        throw error;
    }
}

/**
 * Adiciona uma nova categoria.
 */
export async function addCategory(name: string, icon?: string): Promise<string> {
    try {
        const categoriesRef = collection(db, 'categories');
        const docRef = await addDoc(categoriesRef, {
            name,
            icon: icon || 'tag',
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Erro ao adicionar categoria:', error);
        throw error;
    }
}

/**
 * Atualiza uma categoria existente.
 */
export async function updateCategory(
    id: string,
    name: string,
    icon?: string
): Promise<void> {
    try {
        const categoryRef = doc(db, 'categories', id);
        await updateDoc(categoryRef, {
            name,
            icon: icon || 'tag',
        });
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        throw error;
    }
}

/**
 * Deleta uma categoria.
 */
export async function deleteCategory(id: string): Promise<void> {
    try {
        const categoryRef = doc(db, 'categories', id);
        await deleteDoc(categoryRef);
    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        throw error;
    }
}
