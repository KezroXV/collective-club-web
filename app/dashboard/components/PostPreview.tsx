"use client";

import { Heart, MessageCircle } from "lucide-react";
import Image from "next/image";

const CATEGORY_PREVIEW = [
  { label: "Conseil", color: "#C9C9C9" },
  { label: "Artisanat", color: "#FF9AA2" },
  { label: "Voyage", color: "#4EA7FF" },
];

interface PostPreviewProps {
  colors: {
    Posts: string;
    Bordures: string;
    Fond: string;
    Police: string;
  };
  selectedFont: string;
  coverImage?: string;
}

export default function PostPreview({ colors, selectedFont, coverImage }: PostPreviewProps) {
  return (
    <div className="sticky top-4">
      <h4 className="font-semibold text-gray-900 mb-4">Aperçu</h4>

      <div
        className="rounded-2xl p-5 mb-6 hover:shadow-sm"
        style={{
          backgroundColor: colors.Fond,
          border: `1px solid ${colors.Bordures}`,
          fontFamily: selectedFont,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.Posts}20` }}
          >
            <span
              className="text-xs font-semibold"
              style={{ color: colors.Posts }}
            >
              TA
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Tester A.
            </p>
            <p className="text-xs text-gray-500">Il y a 2 heures</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap mb-3">
          {CATEGORY_PREVIEW.map((c) => (
            <div
              key={c.label}
              className="flex items-center gap-3 rounded-full border px-4 py-2 bg-white/60 backdrop-blur-sm"
              style={{ borderColor: colors.Bordures }}
            >
              <span
                className="inline-block rounded-full"
                style={{
                  width: 18,
                  height: 18,
                  backgroundColor: c.color,
                }}
              />
              <span className="text-gray-900 text-sm font-medium">
                {c.label}
              </span>
            </div>
          ))}
        </div>
        <p
          className="text-[15px] mb-3 font-medium"
          style={{ color: colors.Police }}
        >
          Vous connaissez un bon site qui vends des marques vintage ?
        </p>
        <div
          className="rounded-xl overflow-hidden border mb-4"
          style={{ borderColor: colors.Bordures }}
        >
          <Image
            src="/Post-picture.png"
            alt="Exemple de post"
            width={800}
            height={420}
            className="w-full h-52 object-cover"
          />
        </div>
        <div className="text-[13px] leading-6 mb-4 text-gray-700">
          <p>
            Hello à tous,
            <br /> En ce moment, je suis grave dans une phase "retro" et
            j'ai vraiment envie de refaire un peu ma garde-robe avec des
            vêtements vintage. J'ai déjà fait quelques friperies en ville
            mais j'aimerais tester des sites e-commerce pour avoir plus de
            choix et dénicher des marques stylées (genre Levi's vintage,
            Adidas old school, Nike années 90, ou même des petites marques
            moins connues mais avec du vrai style). Le problème, c'est que
            sur le net, il y a un peu de tout : des sites hyper chers, des
            arnaques, et parfois des sélections qui sentent la fast
            fashion… Du coup, je me tourne vers vous pour avoir vos
            recommandations de boutiques en ligne fiables, avec une vraie
            sélection de pièces vintage ! Ça peut être des plateformes
            spécialisées, des shops indépendants ou même des comptes
            Insta/Depop/Vinted si vous avez eu de vraies bonnes
            expériences. Je suis surtout preneur de sites où :
          </p>
          <ul className="my-3 pl-4">
            <li>
              La qualité est au rendez-vous (pas des fringues qui
              tombent en morceaux après 2 lavages…)
            </li>
            <li>
              L'authenticité est garantie (vraies marques, pas de copies
              ni de faux vintage)
            </li>
            <li>
              Les descriptions/taille sont fiables (c'est chaud
              d'acheter en ligne sans pouvoir essayer)
            </li>
          </ul>
          <p>
            Bref, n'hésitez pas à balancer vos meilleures adresses, vos
            avis, ou même vos achats coup de cœur récents (avec photos si
            vous voulez montrer vos trouvailles !). Si vous avez eu des
            mauvaises surprises aussi, je veux bien vos mises en garde
            pour éviter de tomber dans les mêmes pièges. Merci d'avance
            pour tous vos retours!
          </p>
        </div>
        <div className="flex items-center gap-5 text-gray-500">
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span className="text-xs">24</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">10</span>
          </div>
        </div>
      </div>

      {coverImage && (
        <div className="bg-white rounded-xl border border-chart-4 overflow-hidden">
          <Image
            src={coverImage}
            alt="Preview"
            width={1200}
            height={200}
            className="w-full h-32 object-cover"
          />
          <div className="p-4">
            <h5 className="font-medium text-sm">
              Avec photo de couverture
            </h5>
            <p className="text-xs text-gray-500 mt-1">
              Aperçu de votre forum
            </p>
          </div>
        </div>
      )}
    </div>
  );
}