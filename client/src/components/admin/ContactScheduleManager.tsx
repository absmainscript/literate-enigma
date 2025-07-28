import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Trash2, Plus, GripVertical, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaWhatsapp, FaInstagram, FaLinkedin, FaTwitter, FaFacebook, FaTelegram, FaDiscord, FaSkype } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

interface ContactScheduleManagerProps {
  contactSettings: any;
}

const contactSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  icon: z.string().min(1, "Ícone é obrigatório"),
  color: z.string().min(1, "Cor é obrigatória"),
  link: z.string().min(1, "Link é obrigatório"),
  isActive: z.boolean(),
  order: z.number().min(0),
});

const scheduleSchema = z.object({
  weekdays: z.string().min(1, "Horário dos dias úteis é obrigatório"),
  saturday: z.string().min(1, "Horário do sábado é obrigatório"),
  sunday: z.string().min(1, "Horário do domingo é obrigatório"),
  additional_info: z.string().optional(),
});

const locationSchema = z.object({
  city: z.string().min(1, "Cidade é obrigatória"),
  maps_link: z.string().min(1, "Link do Google Maps é obrigatório"),
});

type ContactForm = z.infer<typeof contactSchema>;
type ScheduleForm = z.infer<typeof scheduleSchema>;
type LocationForm = z.infer<typeof locationSchema>;

const iconMap: { [key: string]: any } = {
  FaWhatsapp: FaWhatsapp,
  FaInstagram: FaInstagram,
  FaLinkedin: FaLinkedin,
  FaXTwitter: FaXTwitter,
  FaTwitter: FaTwitter,
  FaFacebook: FaFacebook,
  FaTelegram: FaTelegram,
  FaDiscord: FaDiscord,
  FaSkype: FaSkype,
  Mail: Mail,
  MapPin: MapPin,
  Clock: Clock,
};

export function ContactScheduleManager({ contactSettings }: ContactScheduleManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contactItems, setContactItems] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (contactSettings) {
      setContactItems(contactSettings.contact_items || []);
    }
  }, [contactSettings]);

  const contactForm = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      title: "",
      description: "",
      icon: "FaWhatsapp",
      color: "#25D366",
      link: "",
      isActive: true,
      order: 0,
    },
  });

  const scheduleForm = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      weekdays: contactSettings?.schedule_info?.weekdays || "Segunda à Sexta: 8h às 18h",
      saturday: contactSettings?.schedule_info?.saturday || "Sábado: 8h às 12h",
      sunday: contactSettings?.schedule_info?.sunday || "Domingo: Fechado",
      additional_info: contactSettings?.schedule_info?.additional_info || "",
    },
  });

  const locationForm = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      city: contactSettings?.location_info?.city || "Campo Mourão, Paraná",
      maps_link: contactSettings?.location_info?.maps_link || "https://maps.google.com/search/Campo+Mourão+Paraná",
    },
  });

  useEffect(() => {
    if (contactSettings) {
      scheduleForm.reset({
        weekdays: contactSettings.schedule_info?.weekdays || "Segunda à Sexta: 8h às 18h",
        saturday: contactSettings.schedule_info?.saturday || "Sábado: 8h às 12h",
        sunday: contactSettings.schedule_info?.sunday || "Domingo: Fechado",
        additional_info: contactSettings.schedule_info?.additional_info || "",
      });
      locationForm.reset({
        city: contactSettings.location_info?.city || "Campo Mourão, Paraná",
        maps_link: contactSettings.location_info?.maps_link || "https://maps.google.com/search/Campo+Mourão+Paraná",
      });
    }
  }, [contactSettings, scheduleForm, locationForm]);

  const updateContactSettings = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/admin/contact-settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contact-settings"] });
      toast({ title: "Configurações atualizadas com sucesso!" });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = contactItems.findIndex((item) => item.id === active.id);
      const newIndex = contactItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(contactItems, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index
      }));

      setContactItems(newItems);
      updateContactSettings.mutate({ contact_items: newItems });
    }
  };

  const onSubmitContact = (data: ContactForm) => {
    let newItems;

    if (editingContact) {
      newItems = contactItems.map(item => 
        item.id === editingContact.id ? { ...item, ...data } : item
      );
    } else {
      const newId = Math.max(...contactItems.map(c => c.id), 0) + 1;
      const newItem = {
        id: newId,
        type: data.title.toLowerCase(),
        ...data,
        order: contactItems.length
      };
      newItems = [...contactItems, newItem];
    }

    setContactItems(newItems);
    updateContactSettings.mutate({ contact_items: newItems });
    setIsContactDialogOpen(false);
    contactForm.reset();
  };

  const onSubmitSchedule = (data: ScheduleForm) => {
    updateContactSettings.mutate({ schedule_info: data });
  };

  const onSubmitLocation = (data: LocationForm) => {
    updateContactSettings.mutate({ location_info: data });
  };

  const openEditContact = (contact: any) => {
    setEditingContact(contact);
    contactForm.reset({
      title: contact.title,
      description: contact.description || "",
      icon: contact.icon,
      color: contact.color,
      order: contact.order,
      link: contact.link,
      isActive: contact.isActive,
    });
    setIsContactDialogOpen(true);
  };

  const deleteContact = (id: number) => {
    const newItems = contactItems.filter(item => item.id !== id);
    setContactItems(newItems);
    updateContactSettings.mutate({ contact_items: newItems });
  };

  const iconOptions = [
    { value: "FaWhatsapp", label: "WhatsApp", icon: "💬" },
    { value: "FaInstagram", label: "Instagram", icon: "📷" },
    { value: "Mail", label: "Email", icon: "📧" },
    { value: "FaLinkedin", label: "LinkedIn", icon: "💼" },
    { value: "FaFacebook", label: "Facebook", icon: "👥" },
    { value: "FaTwitter", label: "Twitter", icon: "🐦" },
    { value: "FaTelegram", label: "Telegram", icon: "✈️" },
    { value: "Phone", label: "Telefone", icon: "📞" },
    { value: "MapPin", label: "Localização", icon: "📍" },
    { value: "Globe", label: "Website", icon: "🌐" },
    { value: "FaXTwitter", label: "X (Twitter)", icon: "X"},
    { value: "FaDiscord", label: "Discord", icon: "D"},
    { value: "FaSkype", label: "Skype", icon: "S"}
  ];

  return (
    <div className="space-y-6">


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Botões de Contato</CardTitle>
                <CardDescription>
                  Configure os botões de contato exibidos na seção de agendamento
                </CardDescription>
              </div>
              <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingContact(null);
                    contactForm.reset();
                    setIsContactDialogOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Contato
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingContact ? "Editar Contato" : "Novo Contato"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...contactForm}>
                    <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-4">
                      <FormField
                        control={contactForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input placeholder="WhatsApp" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={contactForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição (Opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="(44) 998-362-704" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={contactForm.control}
                          name="icon"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ícone</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>

                              <SelectItem value="FaWhatsapp">
                                <div className="flex items-center gap-2">
                                  <FaWhatsapp className="text-green-500" />
                                  WhatsApp
                                </div>
                              </SelectItem>
                              <SelectItem value="FaInstagram">
                                <div className="flex items-center gap-2">
                                  <FaInstagram className="text-pink-500" />
                                  Instagram
                                </div>
                              </SelectItem>
                              <SelectItem value="FaLinkedin">
                                <div className="flex items-center gap-2">
                                  <FaLinkedin className="text-blue-500" />
                                  LinkedIn
                                </div>
                              </SelectItem>
                              <SelectItem value="FaXTwitter">
                                <div className="flex items-center gap-2">
                                  <FaXTwitter className="text-gray-900" />
                                  X (Twitter)
                                </div>
                              </SelectItem>
                              <SelectItem value="FaFacebook">
                                <div className="flex items-center gap-2">
                                  <FaFacebook className="text-blue-600" />
                                  Facebook
                                </div>
                              </SelectItem>
                              <SelectItem value="FaTelegram">
                                <div className="flex items-center gap-2">
                                  <FaTelegram className="text-blue-500" />
                                  Telegram
                                </div>
                              </SelectItem>
                              <SelectItem value="FaDiscord">
                                <div className="flex items-center gap-2">
                                  <FaDiscord className="text-indigo-500" />
                                  Discord
                                </div>
                              </SelectItem>
                              <SelectItem value="FaSkype">
                                <div className="flex items-center gap-2">
                                  <FaSkype className="text-blue-500" />
                                  Skype
                                </div>
                              </SelectItem>
                              <SelectItem value="Mail">
                                <div className="flex items-center gap-2">
                                  <Mail className="text-red-500" />
                                  Email
                                </div>
                              </SelectItem>

                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={contactForm.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cor</FormLabel>
                              <div className="flex items-center space-x-2">
                                <FormControl>
                                  <Input type="color" className="w-12 h-10" {...field} />
                                </FormControl>
                                <FormControl>
                                  <Input placeholder="#25D366" {...field} />
                                </FormControl>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={contactForm.control}
                        name="link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link</FormLabel>
                            <FormControl>
                              <Input placeholder="https://wa.me/5544998362704" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={contactForm.control}
                          name="order"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ordem</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={contactForm.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Ativo</FormLabel>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">
                          {editingContact ? "Atualizar" : "Criar"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={contactItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {contactItems
                    .sort((a, b) => a.order - b.order)
                    .map((contact) => (
                      <SortableContactItem
                        key={contact.id}
                        contact={contact}
                        onEdit={() => openEditContact(contact)}
                        onDelete={() => deleteContact(contact.id)}
                      />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">🕒</span>
                    Card de Horários
                  </CardTitle>
                  <CardDescription>
                    Configure os horários de atendimento e controle a visibilidade do card
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={contactSettings?.schedule_info?.isActive !== false}
                    onCheckedChange={(checked) => {
                      const newScheduleInfo = { 
                        ...contactSettings?.schedule_info, 
                        isActive: checked 
                      };
                      updateContactSettings.mutate({
                        schedule_info: newScheduleInfo
                      });
                    }}
                  />
                  <Badge variant={contactSettings?.schedule_info?.isActive !== false ? "default" : "secondary"}>
                    {contactSettings?.schedule_info?.isActive !== false ? "Visível" : "Oculto"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...scheduleForm}>
                <form onSubmit={scheduleForm.handleSubmit(onSubmitSchedule)} className="space-y-4">
                  <FormField
                    control={scheduleForm.control}
                    name="weekdays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Segunda à Sexta</FormLabel>
                        <FormControl>
                          <Input placeholder="8h às 18h" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={scheduleForm.control}
                    name="saturday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sábado</FormLabel>
                        <FormControl>
                          <Input placeholder="8h às 12h" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={scheduleForm.control}
                    name="sunday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domingo</FormLabel>
                        <FormControl>
                          <Input placeholder="Fechado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={scheduleForm.control}
                    name="additional_info"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Informações Adicionais</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Horários flexíveis disponíveis" rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Salvar Horários
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    Card de Localização
                  </CardTitle>
                  <CardDescription>
                    Configure cidade e link do Google Maps, ideal para atendimentos presenciais
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={contactSettings?.location_info?.isActive !== false}
                    onCheckedChange={(checked) => {
                      const newLocationInfo = { 
                        ...contactSettings?.location_info, 
                        isActive: checked 
                      };
                      updateContactSettings.mutate({
                        location_info: newLocationInfo
                      });
                    }}
                  />
                  <Badge variant={contactSettings?.location_info?.isActive !== false ? "default" : "secondary"}>
                    {contactSettings?.location_info?.isActive !== false ? "Visível" : "Oculto"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...locationForm}>
                <form onSubmit={locationForm.handleSubmit(onSubmitLocation)} className="space-y-4">
                  <FormField
                    control={locationForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Campo Mourão, Paraná" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={locationForm.control}
                    name="maps_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link do Google Maps</FormLabel>
                        <FormControl>
                          <Input placeholder="https://maps.google.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Salvar Localização
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SortableContactItem({ contact, onEdit, onDelete }: { 
  contact: any; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4 cursor-move">
      <div className="flex justify-between items-start">
        <div className="flex-1 flex items-start gap-4">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: contact.color }}
          >
            <span className="text-white text-sm">
              {contact.icon === 'FaWhatsapp' ? '💬' :
               contact.icon === 'FaInstagram' ? '📷' :
               contact.icon === 'Mail' ? '📧' :
               contact.icon === 'FaLinkedin' ? '💼' : '📞'}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{contact.title}</h4>
              <Badge variant={contact.isActive ? "default" : "secondary"} className="text-xs">
                {contact.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            {contact.description && (
              <p className="text-sm text-muted-foreground">{contact.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">Ordem: {contact.order}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function IconComponent({ icon }: { icon: string }) {
  const Icon = iconMap[icon] || MessageCircle;
  return <Icon />;
}