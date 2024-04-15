class CheckoutsController < ApplicationController
  def create
    begin
      stripe_secret_key = Rails.application.credentials.dig(:stripe, :secret_key)
      Stripe.api_key = stripe_secret_key

      cart = params[:cart]
      line_items = []

      cart.each do |item|
        product = Product.find(item["id"])
        product_stock = product.stocks.find { |ps| ps.size == item["size"] }

        if product_stock.nil?
          render json: { error: "No stock available for #{product.name} in size #{item['size']}." }, status: 400
          return
        end

        if product_stock.amount < item["quantity"].to_i
          render json: { error: "Not enough stock for #{product.name} in size #{item["size"]}. Only #{product_stock.amount} left." }, status: 400
          return
        end

        line_items << {
          quantity: item["quantity"].to_i,
          price_data: {
            product_data: {
              name: item["name"],
              metadata: { product_id: product.id, size: item["size"], product_stock_id: product_stock.id }
            },
            currency: "usd",
            unit_amount: item["price"].to_i * 100  # Ensure this matches your Stripe currency unit requirements
          }
        }
      end

      session = Stripe::Checkout::Session.create(
        mode: "payment",
        line_items: line_items,
        success_url: "http://localhost:3000/success",
        cancel_url: "http://localhost:3000/cancel",
        shipping_address_collection: {
          allowed_countries: ['US', 'CA']
        }
      )

      render json: { url: session.url }
    rescue => e
      render json: { error: e.message }, status: 500
    end
  end

  def success
    render :success
  end

  def cancel
    render :cancel
  end
end
