import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
    Button,
    Card,
    Chip,
    DataTable,
    Dialog,
    Divider,
    HelperText,
    IconButton,
    List,
    Modal,
    Portal,
    Provider,
    Switch,
    Text,
    TextInput,
    useTheme
} from 'react-native-paper';
import { type ProductsSortDirection, type ProductsSortField, useProductsFilters } from '../contexts/ProductsFiltersContext';
import * as CategoriesService from '../services/categories';
import * as ProductsService from '../services/products';
import { spacing, textSpacing, typography } from '../styles/theme';
import { Category, Product } from '../types';

// Constrói URI de imagem a partir de base64 + mime (compatível com dados do cliente)
function buildImageUriFromProduct(p?: Partial<Product>): string | undefined {
    if (!p || !p.imageBase64) return undefined;
    const b64 = p.imageBase64;
    if (b64.startsWith('data:')) return b64; // já é data URI
    const mime = p.imageMime || 'image/jpeg';
    return `data:${mime};base64,${b64}`;
}

type SortField = ProductsSortField;
type SortDirection = ProductsSortDirection;

// Lista de ícones disponíveis para categorias
const AVAILABLE_ICONS = [
    'food', 'cup', 'pizza', 'hamburger', 'ice-cream',
    'coffee', 'glass-cocktail', 'food-apple', 'cake',
    'silverware-fork-knife', 'bottle-soda', 'beer', 'tea'
];

// Rótulos em PT-BR para os ícones
const ICON_LABELS_PTBR: Record<string, string> = {
    'food': 'Comida',
    'cup': 'Copo',
    'pizza': 'Pizza',
    'hamburger': 'Hambúrguer',
    'ice-cream': 'Sorvete',
    'coffee': 'Café',
    'glass-cocktail': 'Coquetel',
    'food-apple': 'Maçã',
    'cake': 'Bolo',
    'silverware-fork-knife': 'Talheres',
    'bottle-soda': 'Refrigerante',
    'beer': 'Cerveja',
    'tea': 'Chá',
};

interface CategoryModalProps {
    visible: boolean;
    onDismiss: () => void;
    category: Category | null;
    onSave: () => void;
    categories: Category[];
}

function CategoryModal({ visible, onDismiss, category, onSave, categories }: CategoryModalProps) {
    const [name, setName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('tag');
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<Category | null>(null);
    const { height } = useWindowDimensions();
    const modalMaxHeight = Math.min(640, Math.max(360, Math.floor(height * 0.85)));

    useEffect(() => {
        if (category) {
            setEditing(category);
            setName(category.name || '');
            setSelectedIcon(category.icon || 'tag');
        } else {
            setEditing(null);
            setName('');
            setSelectedIcon('tag');
        }
    }, [category, visible]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Erro', 'Nome da categoria é obrigatório');
            return;
        }

        setLoading(true);
        try {
            if (editing) {
                await CategoriesService.updateCategory(editing.id, name.trim(), selectedIcon);
                Alert.alert('Sucesso', 'Categoria atualizada!');
            } else {
                await CategoriesService.addCategory(name.trim(), selectedIcon);
                Alert.alert('Sucesso', 'Categoria criada!');
            }
            onSave();
            onDismiss();
        } catch (error) {
            console.error('Erro ao salvar categoria:', error);
            Alert.alert('Erro', 'Falha ao salvar categoria');
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (cat: Category) => {
        setConfirmDeleteTarget(cat);
    };

    const performDelete = async (cat: Category) => {
        if (!cat?.id) {
            Alert.alert('Erro', 'Categoria inválida para exclusão');
            return;
        }
        setDeleting(true);
        try {
            await CategoriesService.deleteCategory(cat.id);
            Alert.alert('Sucesso', 'Categoria excluída!');
            setConfirmDeleteTarget(null);
            onSave();
            onDismiss();
        } catch (error) {
            console.error('Erro ao excluir categoria:', error);
            Alert.alert('Erro', 'Falha ao excluir categoria');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
                <Card style={[styles.categoryModalCard, { maxHeight: modalMaxHeight }]}>
                    <Card.Title
                        title={editing ? 'Editar Categoria' : 'Nova Categoria'}
                        subtitle="Crie, edite e exclua categorias. Excluir pode afetar produtos vinculados."
                    />
                    <Card.Content>
                        <ScrollView style={{ maxHeight: modalMaxHeight - 140 }} contentContainerStyle={{ paddingBottom: spacing.md }}>
                            {categories.length > 0 && (
                                <View style={{ marginBottom: spacing.md }}>
                                    <Text variant="labelLarge" style={{ marginBottom: 8 }}>Categorias existentes</Text>
                                    <ScrollView style={{ maxHeight: 200 }}>
                                        {categories.map(c => (
                                            <View key={c.id} style={styles.categoryRow}>
                                                <Button
                                                    mode={editing?.id === c.id ? 'contained-tonal' : 'text'}
                                                    icon={c.icon || 'tag'}
                                                    onPress={() => {
                                                        setEditing(c);
                                                        setName(c.name);
                                                        setSelectedIcon(c.icon || 'tag');
                                                    }}
                                                >
                                                    {c.name}
                                                </Button>
                                                <View style={{ flexDirection: 'row' }}>
                                                    <IconButton
                                                        icon="pencil"
                                                        onPress={() => {
                                                            setEditing(c);
                                                            setName(c.name);
                                                            setSelectedIcon(c.icon || 'tag');
                                                        }}
                                                    />
                                                    <IconButton
                                                        icon="delete"
                                                        iconColor="#d32f2f"
                                                        onPress={() => confirmDelete(c)}
                                                    />
                                                </View>
                                            </View>
                                        ))}
                                    </ScrollView>
                                    <Button
                                        icon="plus"
                                        onPress={() => {
                                            setEditing(null);
                                            setName('');
                                            setSelectedIcon('tag');
                                        }}
                                    >
                                        Nova categoria
                                    </Button>
                                    <Divider style={{ marginVertical: spacing.md }} />
                                </View>
                            )}
                            <TextInput
                                label="Nome da Categoria"
                                mode="outlined"
                                value={name}
                                onChangeText={setName}
                                style={{ marginBottom: spacing.lg }}
                            />

                            <Text variant="labelLarge" style={{ marginBottom: spacing.sm }}>Selecione um Ícone:</Text>
                            <View style={styles.iconGrid}>
                                {AVAILABLE_ICONS.map((icon) => (
                                    <Chip
                                        key={icon}
                                        selected={selectedIcon === icon}
                                        onPress={() => setSelectedIcon(icon)}
                                        icon={icon}
                                        style={styles.iconChip}
                                    >
                                        {ICON_LABELS_PTBR[icon] ?? icon}{selectedIcon === icon ? ' ✓' : ''}
                                    </Chip>
                                ))}
                            </View>
                        </ScrollView>
                    </Card.Content>
                    <Card.Actions style={{ justifyContent: 'space-between' }}>
                        <View>
                            {editing && (
                                <Button onPress={() => confirmDelete(editing)} textColor="#d32f2f" icon="delete" disabled={deleting}>
                                    Excluir
                                </Button>
                            )}
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <Button onPress={onDismiss} disabled={loading || deleting}>
                                Cancelar
                            </Button>
                            <Button mode="contained" onPress={handleSave} loading={loading} disabled={loading || deleting}>
                                Salvar
                            </Button>
                        </View>
                    </Card.Actions>
                    <Portal>
                        <Dialog visible={!!confirmDeleteTarget} onDismiss={() => setConfirmDeleteTarget(null)}>
                            <Dialog.Title>Excluir categoria</Dialog.Title>
                            <Dialog.Content>
                                <Text>
                                    Atenção: excluir a categoria
                                    {confirmDeleteTarget ? ` "${confirmDeleteTarget.name}" ` : ' '}pode causar inconsistência temporária em produtos que a utilizam.
                                    Em versões futuras, implementaremos exclusão segura (migração/reatribuição automática).
                                    Deseja prosseguir?
                                </Text>
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button onPress={() => setConfirmDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
                                <Button onPress={() => confirmDeleteTarget && performDelete(confirmDeleteTarget)} textColor="#d32f2f" disabled={deleting}>
                                    Excluir
                                </Button>
                            </Dialog.Actions>
                        </Dialog>
                    </Portal>
                </Card>
            </Modal>
        </Portal>
    );
}

function formatBRL(value: number): string {
    try {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    } catch {
        const fixed = value.toFixed(2).replace('.', ',');
        return `R$${fixed}`;
    }
}

// Formata número para string decimal BR (sem símbolo), ex: 10 -> "10,00"
function formatNumberToBRDec(value: number): string {
    const fixed = isFinite(value) ? value.toFixed(2) : '0.00';
    const [intPart, frac] = fixed.split('.');
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${intFormatted},${frac}`;
}

// Converte entrada de texto para decimal BR com 2 casas baseado em dígitos (cents)
function formatPriceInputBR(text: string): string {
    const digits = (text || '').replace(/\D/g, '');
    const number = parseInt(digits || '0', 10);
    const value = (number / 100).toFixed(2); // sempre 2 casas
    const [intPart, frac] = value.split('.');
    const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${intFormatted},${frac}`;
}

// Converte string decimal BR (ex: 1.234,56) para número JS
function parseBRDecToNumber(text: string): number {
    if (!text) return 0;
    const normalized = text.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(normalized);
    return isNaN(n) ? 0 : n;
}
interface ProductFormProps {
    visible: boolean;
    onDismiss: () => void;
    product: Product | null;
    onSave: () => void;
    categories: Category[];
    onManageCategories: (category?: Category) => void;
}

function ProductForm({ visible, onDismiss, product, onSave, categories, onManageCategories }: ProductFormProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const { width, height } = useWindowDimensions();
    const isWide = width >= 1024;
    const modalMaxHeight = Math.min(720, Math.max(480, Math.floor(height * 0.9)));

    useEffect(() => {
        if (product) {
            setName(product.name || '');
            setDescription(product.description || '');
            setPrice(
                typeof product.price === 'number' ? formatNumberToBRDec(product.price) : ''
            );
            setCategory(product.category || '');
            setImage(buildImageUriFromProduct(product) || null);
        } else {
            resetForm();
        }
    }, [product, visible]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setPrice('');
        setCategory('');
        setImage(null);
    };

    const pickImage = async () => {
        setImageLoading(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
                base64: true,
            });
            if (!result.canceled && result.assets[0].base64) {
                setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
            }
        } catch (e) {
            console.error('Erro ao selecionar imagem:', e);
            Alert.alert('Erro', 'Falha ao selecionar imagem');
        } finally {
            setImageLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Erro', 'Nome do produto é obrigatório');
            return;
        }
        const parsedPrice = parseBRDecToNumber(price);
        if (!price || parsedPrice <= 0) {
            Alert.alert('Erro', 'Preço deve ser maior que zero');
            return;
        }
        if (!category) {
            Alert.alert('Erro', 'Categoria é obrigatória');
            return;
        }

        setLoading(true);
        try {
            let imageBase64: string | undefined;
            let imageMime: string | undefined;
            if (image) {
                if (image.startsWith('data:') && image.includes(';base64,')) {
                    const mime = image.substring(5, image.indexOf(';'));
                    const payload = image.substring(image.indexOf(',') + 1);
                    imageMime = mime;
                    imageBase64 = payload;
                } else {
                    imageMime = 'image/jpeg';
                    imageBase64 = image;
                }
            }

            const newProduct = {
                name: name.trim(),
                description: description.trim(),
                price: parsedPrice,
                category,
                imageBase64,
                imageMime,
            } as const;

            if (product) {
                await ProductsService.updateProduct(product.id, newProduct);
                Alert.alert('Sucesso', 'Produto atualizado com sucesso!');
            } else {
                await ProductsService.addProduct(newProduct as any);
                Alert.alert('Sucesso', 'Produto criado com sucesso!');
            }
            onSave();
            onDismiss();
        } catch (e) {
            console.error('Erro ao salvar produto:', e);
            Alert.alert('Erro', 'Falha ao salvar produto. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
                <Card style={[styles.modalCard, isWide && styles.modalCardWide, { maxHeight: modalMaxHeight }]}>
                    <Card.Title
                        title={product ? 'Editar produto' : 'Adicionar produto'}
                    />
                    {isWide ? (
                        <Card.Content style={{ paddingBottom: 0 }}>
                            <ScrollView style={{ maxHeight: modalMaxHeight - 160 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.sm }}>
                                <View style={[styles.formRow, { gap: spacing.xl }]}>
                                    <View style={[styles.formColumn, { maxWidth: 320 }]}>
                                        {image ? (
                                            <View style={styles.imagePreviewContainer}>
                                                <Image source={{ uri: image }} style={[styles.previewImageLarge, { alignSelf: 'flex-start', maxWidth: 300 }]} />
                                                <Button onPress={() => setImage(null)} style={{ marginTop: spacing.sm }}>Remover Imagem</Button>
                                            </View>
                                        ) : null}
                                        <Button mode="outlined" onPress={pickImage} disabled={imageLoading} loading={imageLoading} icon="image">
                                            {image ? 'Trocar imagem' : imageLoading ? 'Carregando...' : 'Selecionar imagem'}
                                        </Button>
                                        <HelperText type="info" visible={true} style={{ fontSize: typography.body, opacity: 0.7 }}>
                                            💡 Imagem quadrada (1:1) melhora a exibição em listas, cards e miniaturas.
                                            Tamanhos sugeridos: 800x800px ou 1024x1024px. Evite formatos retangulares para evitar cortes.
                                        </HelperText>
                                    </View>
                                    <View style={[styles.formColumn, { paddingLeft: spacing.lg }]}>
                                        <TextInput label="Nome do Produto" mode="outlined" value={name} onChangeText={setName} style={{ marginBottom: spacing.sm }} />
                                        <TextInput label="Descrição (multilinha)" mode="outlined" multiline numberOfLines={4} value={description} onChangeText={setDescription} style={{ marginBottom: spacing.sm }} />
                                        <View style={{ flexDirection: 'row', gap: spacing.md }}>
                                            <TextInput
                                                label="Preço"
                                                mode="outlined"
                                                keyboardType="numeric"
                                                value={price}
                                                onChangeText={(t) => setPrice(formatPriceInputBR(t))}
                                                left={<TextInput.Affix text="R$" />}
                                                style={{ flex: 1 }}
                                            />
                                            <View style={{ flex: 1 }}>
                                                <TextInput
                                                    label="Categoria"
                                                    mode="outlined"
                                                    value={category || ''}
                                                    editable={false}
                                                    right={<TextInput.Icon icon="chevron-down" onPress={() => setCategoryPickerVisible(true)} />}
                                                />
                                                <Text variant="bodySmall" style={{ marginTop: spacing.xs, opacity: 0.7 }} onPress={() => onManageCategories()}>
                                                    Gerenciar categorias
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>
                        </Card.Content>
                    ) : (
                        <ScrollView style={[styles.modalScrollView, { maxHeight: modalMaxHeight - 160 }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.sm }}>
                            <Card.Content style={styles.formContent}>
                                {image && (
                                    <View style={styles.imagePreviewContainer}>
                                        <Image source={{ uri: image }} style={styles.previewImageLarge} />
                                        <Button onPress={() => setImage(null)} style={{ marginTop: spacing.sm }}>Remover Imagem</Button>
                                    </View>
                                )}
                                <TextInput label="Nome do Produto" mode="outlined" value={name} onChangeText={setName} style={{ marginBottom: spacing.sm }} />
                                <TextInput label="Descrição (multilinha)" mode="outlined" multiline numberOfLines={4} value={description} onChangeText={setDescription} style={{ marginBottom: spacing.sm }} />
                                <TextInput
                                    label="Preço"
                                    mode="outlined"
                                    keyboardType="numeric"
                                    value={price}
                                    onChangeText={(t) => setPrice(formatPriceInputBR(t))}
                                    left={<TextInput.Affix text="R$" />}
                                />
                                <View style={{ marginTop: 8 }}>
                                    <TextInput
                                        label="Categoria"
                                        mode="outlined"
                                        value={category || ''}
                                        editable={false}
                                        right={<TextInput.Icon icon="chevron-down" onPress={() => setCategoryPickerVisible(true)} />}
                                    />
                                    <Text variant="bodySmall" style={{ marginTop: spacing.xs, opacity: 0.7 }} onPress={() => onManageCategories()}>
                                        Gerenciar categorias
                                    </Text>
                                </View>
                                <View style={{ marginTop: spacing.lg }}>
                                    <Button mode="outlined" onPress={pickImage} disabled={imageLoading} loading={imageLoading}>
                                        {imageLoading ? 'Carregando...' : 'Selecionar Imagem'}
                                    </Button>
                                    <HelperText type="info" visible={true} style={{ fontSize: typography.body, opacity: 0.7 }}>
                                        💡 Imagem quadrada (1:1) melhora a exibição em listas, cards e miniaturas.
                                        Tamanhos sugeridos: 800x800px ou 1024x1024px. Evite formatos retangulares para evitar cortes.
                                    </HelperText>
                                </View>
                            </Card.Content>
                        </ScrollView>
                    )}
                    <Card.Actions>
                        <Button onPress={onDismiss} disabled={loading}>Cancelar</Button>
                        <Button mode="contained" onPress={handleSave} loading={loading} disabled={loading}>
                            {product ? 'Atualizar' : 'Salvar'}
                        </Button>
                    </Card.Actions>
                    {/* Dialog de seleção de categoria para evitar overflow do Menu dentro do Modal */}
                    <Portal>
                        <Dialog visible={categoryPickerVisible} onDismiss={() => setCategoryPickerVisible(false)}>
                            <Dialog.Title>Selecionar Categoria</Dialog.Title>
                            <Dialog.ScrollArea>
                                <ScrollView style={{ maxHeight: 300 }}>
                                    {categories.map((cat) => (
                                        <List.Item
                                            key={cat.id}
                                            title={cat.name}
                                            left={props => <IconButton icon={cat.icon || 'tag'} {...props} />}
                                            onPress={() => { setCategory(cat.name); setCategoryPickerVisible(false); }}
                                        />
                                    ))}
                                </ScrollView>
                            </Dialog.ScrollArea>
                            <Dialog.Actions>
                                <Button onPress={() => setCategoryPickerVisible(false)}>Fechar</Button>
                            </Dialog.Actions>
                        </Dialog>
                    </Portal>
                </Card>
            </Modal>
        </Portal>
    );
}

export default function ProductsScreen() {
    const theme = useTheme();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formVisible, setFormVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const { activeCategories, setActiveCategories, sortField, setSortField, sortDirection, setSortDirection } = useProductsFilters();
    const [reopenAfterCategories, setReopenAfterCategories] = useState(false);
    const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

    const loadProducts = React.useCallback(async () => {
        try {
            const prods = await ProductsService.getProducts();
            setProducts(prods);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            throw error;
        }
    }, []);

    const loadCategories = React.useCallback(async () => {
        try {
            const cats = await CategoriesService.getCategories();
            setCategories(cats);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            throw error;
        }
    }, []);

    const loadData = React.useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([loadProducts(), loadCategories()]);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            Alert.alert('Erro', 'Falha ao carregar dados');
        } finally {
            setLoading(false);
        }
    }, [loadProducts, loadCategories]);

    const sortProducts = React.useCallback(() => {
        // Primeiro aplica filtros de categoria
        const base = activeCategories.length > 0
            ? products.filter(p => activeCategories.includes(p.category))
            : products;

        const sorted = [...base].sort((a, b) => {
            let compareResult = 0;

            switch (sortField) {
                case 'name':
                    compareResult = a.name.localeCompare(b.name);
                    break;
                case 'category':
                    compareResult = (a.category || '').localeCompare(b.category || '');
                    break;
                case 'price':
                    compareResult = a.price - b.price;
                    break;
            }

            return sortDirection === 'asc' ? compareResult : -compareResult;
        });

        setFilteredProducts(sorted);
    }, [products, sortField, sortDirection, activeCategories]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        sortProducts();
    }, [sortProducts]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormVisible(true);
    };

    const handleDelete = (product: Product) => {
        Alert.alert(
            'Confirmar Exclusão',
            `Deseja realmente excluir o produto "${product.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await ProductsService.deleteProduct(product.id);
                            Alert.alert('Sucesso', 'Produto excluído com sucesso!');
                            loadProducts();
                        } catch (error) {
                            console.error('Erro ao excluir produto:', error);
                            Alert.alert('Erro', 'Falha ao excluir produto');
                        }
                    },
                },
            ]
        );
    };

    const handleFormDismiss = () => {
        setFormVisible(false);
        setEditingProduct(null);
    };

    const handleFormSave = () => {
        loadProducts();
    };

    const handleCategoryModalDismiss = () => {
        setCategoryModalVisible(false);
        setEditingCategory(null);
        if (reopenAfterCategories) {
            setFormVisible(true);
            setReopenAfterCategories(false);
        }
    };

    const handleCategorySave = () => {
        loadCategories();
    };

    const handleManageCategories = (category?: Category) => {
        setEditingCategory(category || null);
        setReopenAfterCategories(formVisible);
        if (formVisible) setFormVisible(false);
        setCategoryModalVisible(true);
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return 'unfold-more-horizontal';
        return sortDirection === 'asc' ? 'arrow-up' : 'arrow-down';
    };

    const getCategoryIcon = (categoryName: string) => {
        const cat = categories.find(c => c.name === categoryName);
        return cat?.icon || 'tag';
    };

    const toggleCategoryFilter = (name: string) => {
        setActiveCategories(prev => prev.includes(name)
            ? prev.filter(n => n !== name)
            : [...prev, name]
        );
    };

    const handleAvailabilityToggle = async (p: Product, value: boolean) => {
        try {
            await ProductsService.updateProductAvailability(p.id, value);
            setProducts(prev => prev.map(x => x.id === p.id ? { ...x, available: value } : x));
        } catch (e) {
            console.error('Erro ao atualizar disponibilidade:', e);
            Alert.alert('Erro', 'Não foi possível atualizar a disponibilidade.');
        }
    };

    return (
        <Provider>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Produtos</Text>
                        <Text style={styles.subtitle}>
                            Gerencie seu catálogo: crie, edite e remova produtos.
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                        <Button
                            mode="outlined"
                            onPress={() => handleManageCategories()}
                            icon="tag-multiple"
                        >
                            Categorias
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() => {
                                setEditingProduct(null);
                                setFormVisible(true);
                            }}
                        >
                            Novo Produto
                        </Button>
                    </View>
                </View>

                <ProductForm
                    visible={formVisible}
                    onDismiss={handleFormDismiss}
                    product={editingProduct}
                    onSave={handleFormSave}
                    categories={categories}
                    onManageCategories={handleManageCategories}
                />

                <CategoryModal
                    visible={categoryModalVisible}
                    onDismiss={handleCategoryModalDismiss}
                    category={editingCategory}
                    onSave={handleCategorySave}
                    categories={categories}
                />

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" />
                        <Text style={{ marginTop: 16 }}>Carregando produtos...</Text>
                    </View>
                ) : (
                    <ScrollView>
                        {/* Filtros por categorias no topo */}
                        {categories.length > 0 && (
                            <View style={styles.categoryChips}>
                                {categories.map((cat) => (
                                    (() => {
                                        const isActive = activeCategories.includes(cat.name);
                                        const bgInactive = theme.colors.surface;
                                        const bgActive =
                                            (theme.colors as any)?.secondaryContainer ??
                                            (theme.colors as any)?.primaryContainer ??
                                            (theme.colors as any)?.surfaceVariant ??
                                            theme.colors.surface;

                                        const borderInactive =
                                            (theme.colors as any)?.outlineVariant ??
                                            theme.colors.outline;

                                        const textInactive =
                                            (theme.colors as any)?.onSurfaceVariant ??
                                            theme.colors.onSurface;
                                        const textActive =
                                            (theme.colors as any)?.onSecondaryContainer ??
                                            (theme.colors as any)?.onPrimaryContainer ??
                                            theme.colors.onSurface;

                                        return (
                                            <Chip
                                                key={cat.id}
                                                selected={isActive}
                                                showSelectedOverlay={false}
                                                mode={isActive ? 'flat' : 'outlined'}
                                                selectedColor={textActive}
                                                onPress={() => toggleCategoryFilter(cat.name)}
                                                icon={cat.icon || 'tag'}
                                                textStyle={{
                                                    color: isActive ? textActive : textInactive,
                                                    fontWeight: isActive ? '700' : '600',
                                                }}
                                                style={StyleSheet.flatten([
                                                    styles.categoryChip,
                                                    {
                                                        backgroundColor: isActive ? bgActive : bgInactive,
                                                        borderColor: borderInactive,
                                                        borderWidth: isActive ? 2 : 1,
                                                    },
                                                ])}
                                            >
                                                {cat.name}
                                            </Chip>
                                        );
                                    })()
                                ))}
                            </View>
                        )}
                        <DataTable>
                            <DataTable.Header>
                                <DataTable.Title style={{ flex: 0.8 }}>
                                    <View style={styles.headerCell}><Text>Foto</Text></View>
                                </DataTable.Title>
                                <DataTable.Title onPress={() => handleSort('name')} style={{ flex: 2 }}>
                                    <View style={styles.headerCell}>
                                        <Text>Nome</Text>
                                        <IconButton icon={getSortIcon('name')} size={16} style={styles.sortIcon} />
                                    </View>
                                </DataTable.Title>
                                <DataTable.Title onPress={() => handleSort('category')} style={{ flex: 1.2 }}>
                                    <View style={styles.headerCell}>
                                        <Text>Categoria</Text>
                                        <IconButton icon={getSortIcon('category')} size={16} style={styles.sortIcon} />
                                    </View>
                                </DataTable.Title>
                                <DataTable.Title onPress={() => handleSort('price')} style={{ flex: 1 }}>
                                    <View style={styles.headerCell}>
                                        <Text>Preço</Text>
                                        <IconButton icon={getSortIcon('price')} size={16} style={styles.sortIcon} />
                                    </View>
                                </DataTable.Title>
                                <DataTable.Title style={{ flex: 1 }}>
                                    <View style={styles.headerCell}><Text>Disponível</Text></View>
                                </DataTable.Title>
                                <DataTable.Title style={{ flex: 1 }}>
                                    <View style={styles.headerCell}><Text>Ações</Text></View>
                                </DataTable.Title>
                            </DataTable.Header>

                            {filteredProducts.map(product => (
                                <DataTable.Row
                                    key={product.id}
                                    style={[{ paddingVertical: spacing.md }, hoveredRowId === product.id ? styles.tableRowHover : null]}
                                    {...({
                                        onMouseEnter: () => setHoveredRowId(product.id),
                                        onMouseLeave: () => setHoveredRowId(null),
                                    } as any)}
                                >
                                    <DataTable.Cell style={{ flex: 0.8 }}>
                                        {product.imageBase64 ? (
                                            <Image
                                                source={{ uri: buildImageUriFromProduct(product) }}
                                                style={styles.thumbnailImage}
                                            />
                                        ) : (
                                            <View style={styles.noImagePlaceholder}>
                                                <IconButton icon="image-off" size={20} />
                                            </View>
                                        )}
                                    </DataTable.Cell>
                                    <DataTable.Cell style={{ flex: 2 }}>
                                        <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                                            {product.name}
                                        </Text>
                                    </DataTable.Cell>
                                    <DataTable.Cell style={{ flex: 1.2, justifyContent: 'center' }}>
                                        <Chip
                                            icon={getCategoryIcon(product.category)}
                                            style={{ alignSelf: 'center' }}
                                        >
                                            {product.category}
                                        </Chip>
                                    </DataTable.Cell>
                                    <DataTable.Cell numeric style={{ flex: 1, justifyContent: 'center' }}>
                                        {formatBRL(product.price)}
                                    </DataTable.Cell>
                                    <DataTable.Cell style={{ flex: 1, justifyContent: 'center' }}>
                                        <Switch
                                            value={product.available !== false}
                                            onValueChange={(v) => handleAvailabilityToggle(product, v)}
                                        />
                                    </DataTable.Cell>
                                    <DataTable.Cell style={{ flex: 1, justifyContent: 'center' }}>
                                        <View style={styles.actionsCell}>
                                            <IconButton
                                                mode="contained"
                                                containerColor="#f3f4f6"
                                                icon="pencil"
                                                size={18}
                                                onPress={() => handleEdit(product)}
                                            />
                                            <IconButton
                                                mode="contained"
                                                containerColor="#f3f4f6"
                                                icon="delete"
                                                size={18}
                                                iconColor="#d32f2f"
                                                onPress={() => handleDelete(product)}
                                            />
                                        </View>
                                    </DataTable.Cell>
                                </DataTable.Row>
                            ))}
                        </DataTable>

                        {filteredProducts.length === 0 && !loading && (
                            <View style={styles.emptyContainer}>
                                <Text>Nenhum produto cadastrado</Text>
                            </View>
                        )}
                    </ScrollView>
                )}

            </View>
        </Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: typography.pageTitle,
        fontWeight: '700',
        marginBottom: textSpacing.pageTitle,
    },
    subtitle: {
        fontSize: typography.cardDescription,
        opacity: 0.8,
        marginTop: spacing.xs,
        marginBottom: textSpacing.cardDescription,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalCard: {
        width: '100%',
        maxWidth: 700,
        maxHeight: '90%',
    },
    modalCardWide: {
        width: '100%',
        maxWidth: 980,
        maxHeight: '90%',
    },
    modalScrollView: {
        maxHeight: 500,
    },
    formRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.lg,
    },
    formColumn: {
        flex: 1,
    },
    categoryModalCard: {
        width: '100%',
        maxWidth: 500,
    },
    formContent: {
        gap: spacing.md,
        paddingVertical: spacing.md,
    },
    imagePreviewContainer: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    previewImageLarge: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 8,
        resizeMode: 'cover',
        alignSelf: 'center',
    },
    thumbnailImage: {
        width: 64,
        height: 64,
        borderRadius: 8,
        resizeMode: 'cover',
        borderWidth: 1,
        borderColor: '#eee',
    },
    noImagePlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        padding: spacing.xxl,
        alignItems: 'center',
    },
    headerCell: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tableRowHover: {
        backgroundColor: '#f7f7f9',
    },
    sortIcon: {
        margin: 0,
        padding: 0,
    },
    actionsCell: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 8,
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    iconChip: {
        marginBottom: spacing.xs,
    },
    categoryChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    categoryChip: {
        borderRadius: 999,
        alignSelf: 'flex-start',
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});
