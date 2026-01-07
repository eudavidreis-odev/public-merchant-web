
import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button, DataTable, Modal, Portal, Provider, TextInput, Card } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Product } from '../types';

const mockProducts: Product[] = [
  { id: '1', name: 'X-Burger', description: 'Pão, carne, queijo', price: 25.50, category: 'comida' },
  { id: '2', name: 'Suco de Laranja', description: '500ml', price: 8.00, category: 'bebida' },
  { id: '3', name: 'Refrigerante Lata', description: '350ml', price: 5.00, category: 'bebida' },
];

function ProductForm({ visible, onDismiss }) {
    const [image, setImage] = useState(null);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
                <Card style={styles.modalCard}>
                    <Card.Title title="Novo Produto" />
                    <Card.Content style={styles.formContent}>
                        <TextInput label="Nome do Produto" mode="outlined" />
                        <TextInput label="Descrição" mode="outlined" multiline />
                        <TextInput label="Preço (R$)" mode="outlined" keyboardType="numeric" />
                        <TextInput label="Categoria" mode="outlined" />
                        <Button mode="outlined" onPress={pickImage} style={{ marginTop: 10 }}>
                            Selecionar Imagem
                        </Button>
                        {image && <Image source={{ uri: image }} style={styles.previewImage} />}
                    </Card.Content>
                    <Card.Actions>
                        <Button onPress={onDismiss}>Cancelar</Button>
                        <Button mode="contained" onPress={onDismiss}>Salvar</Button>
                    </Card.Actions>
                </Card>
            </Modal>
        </Portal>
    )
}

export default function ProductsScreen() {
  const [products, setProducts] = useState(mockProducts);
  const [formVisible, setFormVisible] = useState(false);

  return (
    <Provider>
        <View style={styles.container}>
            <View style={styles.header}>
                <Text variant="displayMedium">Produtos</Text>
                <Button mode="contained" onPress={() => setFormVisible(true)}>Novo Produto</Button>
            </View>

            <ProductForm visible={formVisible} onDismiss={() => setFormVisible(false)} />

            <DataTable>
                <DataTable.Header>
                <DataTable.Title>Nome</DataTable.Title>
                <DataTable.Title>Categoria</DataTable.Title>
                <DataTable.Title numeric>Preço</DataTable.Title>
                </DataTable.Header>

                {products.map(product => (
                <DataTable.Row key={product.id}>
                    <DataTable.Cell>{product.name}</DataTable.Cell>
                    <DataTable.Cell>{product.category}</DataTable.Cell>
                    <DataTable.Cell numeric>R$ {product.price.toFixed(2)}</DataTable.Cell>
                </DataTable.Row>
                ))}
            </DataTable>
        </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  modalCard: {
      width: '80%',
      maxWidth: 500,
  },
  formContent: {
      gap: 10,
      paddingVertical: 10,
  },
  previewImage: {
      width: 100,
      height: 100,
      marginTop: 10,
      alignSelf: 'center',
      borderRadius: 4,
  }
});
