import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Copy, MessageCircle, AlertTriangle, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface WhatsAppGuestData {
  phone: string;
  message: string;
  url: string;
  guestName: string;
  phoneValid: boolean;
}

interface StartTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whatsappData: {
    phone: string;
    message: string;
    url: string;
    guestName: string;
    driverName: string;
    startedAt: string;
    phoneValid: boolean;
  } | null;
  whatsappGuests?: WhatsAppGuestData[];
  driverName?: string;
  startedAt?: string;
}

function GuestSection({ guest, isOnly }: { guest: WhatsAppGuestData; isOnly: boolean }) {
  return (
    <div className="space-y-3">
      {!isOnly && guest.guestName && (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{guest.guestName}</span>
        </div>
      )}

      <div className="rounded-xl bg-muted/50 border border-border/40 p-4">
        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {guest.message}
        </p>
      </div>

      {!guest.phoneValid && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {guest.guestName
            ? `Telefone de ${guest.guestName} inválido ou não cadastrado`
            : 'Telefone do hóspede inválido ou não cadastrado'}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 gap-1.5"
          onClick={() => {
            navigator.clipboard.writeText(guest.message);
            toast.success(guest.guestName ? `Mensagem para ${guest.guestName} copiada!` : 'Mensagem copiada!');
          }}
        >
          <Copy className="w-4 h-4" />
          Copiar
        </Button>
        <Button
          className={cn(
            'flex-1 gap-1.5',
            guest.phoneValid
              ? 'bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white'
              : 'opacity-50 cursor-not-allowed'
          )}
          disabled={!guest.phoneValid}
          onClick={() => {
            if (guest.phoneValid) {
              window.open(guest.url, '_blank');
            }
          }}
        >
          <MessageCircle className="w-4 h-4" />
          Enviar no WhatsApp
        </Button>
      </div>
    </div>
  );
}

export default function StartTripDialog({ open, onOpenChange, whatsappData, whatsappGuests, driverName, startedAt }: StartTripDialogProps) {
  // Determine the list of guests to render
  const guests: WhatsAppGuestData[] = whatsappGuests && whatsappGuests.length > 0
    ? whatsappGuests
    : whatsappData
      ? [{ phone: whatsappData.phone, message: whatsappData.message, url: whatsappData.url, guestName: whatsappData.guestName, phoneValid: whatsappData.phoneValid }]
      : [];

  const resolvedStartedAt = startedAt || whatsappData?.startedAt;
  if (!resolvedStartedAt || guests.length === 0) return null;

  const startTime = new Date(resolvedStartedAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });

  const isMultiGuest = guests.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="w-5 h-5 text-accent" />
            Viagem Iniciada
          </DialogTitle>
          <DialogDescription>
            Iniciada às {startTime} — envie a mensagem {isMultiGuest ? 'aos hóspedes' : 'ao hóspede'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-accent/10 text-accent border-accent/20 gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Em deslocamento
            </Badge>
            <span className="text-xs text-muted-foreground">às {startTime}</span>
            {isMultiGuest && (
              <Badge variant="outline" className="text-xs">
                {guests.length} hóspedes
              </Badge>
            )}
          </div>

          {guests.map((guest, idx) => (
            <div key={guest.guestName + idx}>
              {isMultiGuest && idx > 0 && <Separator className="my-2" />}
              <GuestSection guest={guest} isOnly={!isMultiGuest} />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
