Feature: Checkout de Pedido
    Como um cliente da lanchonete
    Quero finalizar meu pedido com os itens selecionados
    Para que a cozinha possa começar a prepará-lo

    Scenario: Criar um pedido com sucesso
        Given que o cliente possui a sessão "session-123"
        And que o carrinho contém um "Hamburguer" com preço 40.00
        When o cliente solicita o checkout
        Then o pedido deve ser gerado com sucesso
        And o status inicial deve ser "RECEIVED"
        And o evento "order.created" deve ser publicado

    Scenario: Tentativa de checkout com carrinho vazio
        Given que o cliente possui a sessão "session-123"
        And que o carrinho está vazio
        When o cliente solicita o checkout
        Then o sistema deve retornar um erro de validação