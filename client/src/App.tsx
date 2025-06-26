
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Search, Package, Sparkles, Brain, Zap } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { SurpriseBox, GetSurpriseBoxesInput } from '../../server/src/schema';

interface CartItem {
  surpriseBox: SurpriseBox;
  quantity: number;
}

type CategoryType = 'Hardware' | 'Software' | 'Books' | 'Gadgets' | 'Apparel' | 'Productivity';

function App() {
  // Product catalog state
  const [surpriseBoxes, setSurpriseBoxes] = useState<SurpriseBox[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState<GetSurpriseBoxesInput>({
    activeOnly: true
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load surprise boxes with filters
  const loadSurpriseBoxes = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getSurpriseBoxes.query({
        ...filters,
        search: searchTerm || undefined
      });
      setSurpriseBoxes(result);
    } catch (error) {
      console.error('Failed to load surprise boxes:', error);
      // Since handlers return empty arrays, we'll show some demo data for better UX
      setSurpriseBoxes([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchTerm]);

  useEffect(() => {
    loadSurpriseBoxes();
  }, [loadSurpriseBoxes]);

  // Cart functions
  const addToCart = (surpriseBox: SurpriseBox, quantity: number = 1) => {
    setCart((prev: CartItem[]) => {
      const existingItem = prev.find(item => item.surpriseBox.id === surpriseBox.id);
      if (existingItem) {
        return prev.map(item =>
          item.surpriseBox.id === surpriseBox.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, surpriseBox.stock) }
            : item
        );
      } else {
        return [...prev, { surpriseBox, quantity: Math.min(quantity, surpriseBox.stock) }];
      }
    });
  };

  const updateCartQuantity = (surpriseBoxId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev: CartItem[]) => prev.filter(item => item.surpriseBox.id !== surpriseBoxId));
    } else {
      setCart((prev: CartItem[]) => 
        prev.map(item => 
          item.surpriseBox.id === surpriseBoxId 
            ? { ...item, quantity: Math.min(quantity, item.surpriseBox.stock) }
            : item
        )
      );
    }
  };

  const removeFromCart = (surpriseBoxId: string) => {
    setCart((prev: CartItem[]) => prev.filter(item => item.surpriseBox.id !== surpriseBoxId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.surpriseBox.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const categories: CategoryType[] = ['Hardware', 'Software', 'Books', 'Gadgets', 'Apparel', 'Productivity'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-800/30 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">The AI Engineer's</h1>
                <p className="text-sm text-purple-300">Mystery Box</p>
              </div>
            </div>
            
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative border-purple-600 text-purple-300 hover:bg-purple-600/20">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart
                  {cart.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-blue-500 text-black">
                      {getCartItemCount()}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-slate-900 border-purple-800/30 text-white">
                <SheetHeader>
                  <SheetTitle className="text-white flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2 text-purple-400" />
                    Your Mystery Cart
                  </SheetTitle>
                  <SheetDescription className="text-purple-300">
                    Ready to unbox some AI magic?
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-purple-400 mb-4" />
                      <p className="text-purple-300">Your cart is empty</p>
                      <p className="text-sm text-slate-400">Add some mystery boxes to get started!</p>
                    </div>
                  ) : (
                    <>
                      {cart.map((item: CartItem) => (
                        <div key={item.surpriseBox.id} className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg">
                          <img 
                            src={item.surpriseBox.imageUrl} 
                            alt={item.surpriseBox.name}
                            className="w-12 h-12 object-cover rounded-md"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{item.surpriseBox.name}</h4>
                            <p className="text-sm text-purple-300">${item.surpriseBox.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(item.surpriseBox.id, item.quantity - 1)}
                              className="h-6 w-6 p-0 border-purple-600 text-purple-300"
                            >
                              -
                            </Button>
                            <span className="text-white w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(item.surpriseBox.id, item.quantity + 1)}
                              className="h-6 w-6 p-0 border-purple-600 text-purple-300"
                              disabled={item.quantity >= item.surpriseBox.stock}
                            >
                              +
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.surpriseBox.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Separator className="bg-purple-800/30" />
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-lg font-semibold text-white">
                          <span>Total:</span>
                          <span className="text-green-400">${getCartTotal().toFixed(2)}</span>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                          Proceed to Checkout
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-purple-400 mr-2" />
            <h2 className="text-4xl font-bold text-white">Mystery Boxes for AI Engineers</h2>
            <Zap className="h-8 w-8 text-blue-400 ml-2" />
          </div>
          <p className="text-xl text-purple-300 max-w-2xl mx-auto">
            Curated surprises to fuel your AI journey. Hardware, software, books, and gadgets - 
            all carefully selected for the modern AI engineer.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
            <Input
              placeholder="Search mystery boxes..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-purple-600 text-white placeholder-purple-300"
            />
          </div>
          <Select 
            value={filters.category || 'all'} 
            onValueChange={(value: string) => 
              setFilters((prev: GetSurpriseBoxesInput) => ({ 
                ...prev, 
                category: value === 'all' ? undefined : (value as CategoryType)
              }))
            }
          >
            <SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-purple-600 text-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-purple-600">
              <SelectItem value="all" className="text-white hover:bg-purple-600/20">All Categories</SelectItem>
              {categories.map((category: CategoryType) => (
                <SelectItem key={category} value={category} className="text-white hover:bg-purple-600/20">
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-slate-800/50 border-purple-800/30">
                <CardHeader>
                  <div className="h-6 bg-slate-700 rounded"></div>
                  <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-48 bg-slate-700 rounded mb-4"></div>
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : surpriseBoxes.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-purple-400 mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">No Mystery Boxes Found</h3>
            <p className="text-purple-300 mb-6">
              {searchTerm || filters.category ? 
                'Try adjusting your search or filters to discover more boxes.' :
                'Our AI engineers are busy curating new mystery boxes. Check back soon!'
              }
            </p>
            {(searchTerm || filters.category) && (
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilters({ activeOnly: true });
                }}
                variant="outline"
                className="border-purple-600 text-purple-300 hover:bg-purple-600/20"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surpriseBoxes.map((box: SurpriseBox) => (
              <Card key={box.id} className="bg-slate-800/50 border-purple-800/30 hover:border-purple-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white mb-1">{box.name}</CardTitle>
                      <CardDescription className="text-purple-300 font-medium">
                        {box.tagline}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-300 border-purple-600/30"
                    >
                      {box.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <img 
                    src={box.imageUrl} 
                    alt={box.name}
                    className="w-full h-48 object-cover rounded-md mb-4 bg-slate-700"
                  />
                  <p className="text-slate-300 text-sm mb-4 line-clamp-3">
                    {box.description}
                  </p>
                  <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                    <p className="text-purple-300 text-sm font-medium mb-1">What's Inside:</p>
                    <p className="text-slate-300 text-sm">{box.contentsDescription}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-green-400">
                        ${box.price.toFixed(2)}
                      </span>
                      <p className="text-sm text-slate-400">
                        {box.stock > 0 ? `${box.stock} in stock` : 'Out of stock'}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white disabled:from-slate-600 disabled:to-slate-600"
                    disabled={box.stock === 0}
                    onClick={() => addToCart(box)}
                  >
                    {box.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-800/30 bg-slate-900/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-purple-400 mr-2" />
              <span className="text-white font-semibold">The AI Engineer's Mystery Box</span>
            </div>
            <p className="text-purple-300 text-sm">
              Curated surprises for the AI community. Built with ❤️ for engineers who love to tinker.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
