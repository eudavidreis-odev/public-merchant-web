/**
 * @packageDocumentation
 * Serviço de produtos para Merchant Web.
 * Gerencia CRUD completo de produtos no Firestore.
 */

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    Timestamp,
    updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageBase64?: string;
    imageMime?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
};

/**
 * Busca todos os produtos do Firestore.
 */
export async function getProducts(): Promise<Product[]> {
    try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const products: Product[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            products.push({
                id: doc.id,
                name: data.name,
                description: data.description,
                price: data.price,
                category: data.category,
                imageBase64: data.imageBase64,
                imageMime: data.imageMime,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
            });
        });

        return products;
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        throw error;
    }
}

/**
 * Busca um produto por ID.
 */
export async function getProductById(id: string): Promise<Product | null> {
    try {
        const productRef = doc(db, 'products', id);
        const docSnap = await getDoc(productRef);

        if (!docSnap.exists()) {
            return null;
        }

        const data = docSnap.data();
        return {
            id: docSnap.id,
            name: data.name,
            description: data.description,
            price: data.price,
            category: data.category,
            imageBase64: data.imageBase64,
            imageMime: data.imageMime,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        };
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        throw error;
    }
}

/**
 * Adiciona um novo produto.
 */
export async function addProduct(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    try {
        const productsRef = collection(db, 'products');
        const docRef = await addDoc(productsRef, {
            ...product,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        throw error;
    }
}

/**
 * Atualiza um produto existente.
 */
export async function updateProduct(
    id: string,
    product: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
    try {
        const productRef = doc(db, 'products', id);
        await updateDoc(productRef, {
            ...product,
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        throw error;
    }
}

/**
 * Deleta um produto.
 */
export async function deleteProduct(id: string): Promise<void> {
    try {
        const productRef = doc(db, 'products', id);
        await deleteDoc(productRef);
    } catch (error) {
        console.error('Erro ao deletar produto:', error);
        throw error;
    }
}
