
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FooterManagerProps {
  footerSettings: any;
}

const generalSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  cnpj: z.string().min(1, "CNPJ é obrigatório"),
  showCnpj: z.boolean(),
  copyright: z.string().min(1, "Copyright é obrigatório"),
  certificationText: z.string().min(1, "Texto de certificações é obrigatório"),
});

export function FooterManager({ footerSettings }: FooterManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  const footerData = footerSettings || {};
  const generalInfo = footerData.general_info || {};
  const contactButtons = footerData.contact_buttons || [];
  const bottomInfo = footerData.bottom_info || {};

  const updateFooterSettings = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/admin/footer-settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/footer-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/footer-settings"] });
      toast({ title: "Configurações do rodapé atualizadas com sucesso!" });
    },
  });

  const generalForm = useForm({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      description: generalInfo.description || "Cuidando da sua saúde mental com carinho e dedicação",
      cnpj: generalInfo.cnpj || "12.345.678/0001-90",
      showCnpj: generalInfo.showCnpj ?? true,
      copyright: bottomInfo.copyright || "© 2024 Dra. Adrielle Benhossi • Todos os direitos reservados",
      certificationText: bottomInfo.certificationText || "Registrada no Conselho Federal de Psicologia<br/>Sigilo e ética profissional",
    },
  });

  const onSubmitGeneral = (data: any) => {
    const updates = {
      general_info: {
        description: data.description,
        cnpj: data.cnpj,
        showCnpj: data.showCnpj,
      },
      bottom_info: {
        copyright: data.copyright,
        certificationText: data.certificationText,
      }
    };
    updateFooterSettings.mutate(updates);
  };

  const iconOptions = [
    { value: "FaWhatsapp", label: "WhatsApp", icon: "💬" },
    { value: "FaInstagram", label: "Instagram", icon: "📷" },
    { value: "FaLinkedin", label: "LinkedIn", icon: "💼" },
    { value: "FaFacebook", label: "Facebook", icon: "👥" },
    { value: "FaTwitter", label: "Twitter", icon: "🐦" },
  ];

  const gradientOptions = [
    { name: "Verde WhatsApp", value: "from-green-400 to-green-500" },
    { name: "Rosa Instagram", value: "from-purple-400 to-pink-500" },
    { name: "Azul LinkedIn", value: "from-blue-500 to-blue-600" },
    { name: "Azul Facebook", value: "from-blue-600 to-blue-700" },
    { name: "Azul Twitter", value: "from-blue-400 to-blue-500" },
    { name: "Roxo Personalizado", value: "from-purple-500 to-purple-600" },
    { name: "Rosa Personalizado", value: "from-pink-500 to-pink-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Informações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais do Rodapé</CardTitle>
          <CardDescription>
            Configure os textos principais, CNPJ e informações de copyright
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...generalForm}>
            <form onSubmit={generalForm.handleSubmit(onSubmitGeneral)} className="space-y-4">
              <FormField
                control={generalForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição Principal</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição que aparece abaixo do nome da psicóloga" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={generalForm.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="12.345.678/0001-90" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={generalForm.control}
                  name="showCnpj"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Exibir CNPJ</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Mostrar CNPJ no rodapé
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={generalForm.control}
                name="copyright"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto de Copyright</FormLabel>
                    <FormControl>
                      <Input placeholder="© 2024 Dra. Adrielle Benhossi..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={generalForm.control}
                name="certificationText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto de Certificações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Registrada no Conselho Federal de Psicologia..." 
                        rows={3} 
                        {...field} 
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground">
                      Use &lt;br/&gt; para quebrar linhas. Aparece abaixo dos ícones de certificação.
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Salvar Informações Gerais</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Botões de Contato */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Botões de Contato</CardTitle>
              <CardDescription>
                Configure os botões de redes sociais e contato do rodapé
              </CardDescription>
            </div>
            <Button onClick={() => setIsContactDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Botão
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contactButtons
              .sort((a: any, b: any) => a.order - b.order)
              .map((button: any) => (
                <Card key={button.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 bg-gradient-to-r ${button.gradient} rounded-lg flex items-center justify-center`}>
                        <span className="text-white text-sm">
                          {iconOptions.find(icon => icon.value === button.icon)?.icon || "📧"}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{button.label}</h4>
                        <p className="text-sm text-muted-foreground">{button.link}</p>
                      </div>
                      <Badge variant={button.isActive ? "default" : "secondary"}>
                        {button.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingContact(button);
                        setIsContactDialogOpen(true);
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => {
                        const newButtons = contactButtons.filter((b: any) => b.id !== button.id);
                        updateFooterSettings.mutate({ contact_buttons: newButtons });
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para editar botões de contato */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Editar Botão de Contato" : "Novo Botão de Contato"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Label</label>
              <Input placeholder="WhatsApp" />
            </div>
            <div>
              <label className="text-sm font-medium">Link</label>
              <Input placeholder="https://wa.me/..." />
            </div>
            <div>
              <label className="text-sm font-medium">Ícone</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ícone" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Gradiente</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um gradiente" />
                </SelectTrigger>
                <SelectContent>
                  {gradientOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsContactDialogOpen(false);
                setEditingContact(null);
              }}>
                Cancelar
              </Button>
              <Button onClick={() => {
                setIsContactDialogOpen(false);
                setEditingContact(null);
                toast({ title: "Botão salvo com sucesso!" });
              }}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
